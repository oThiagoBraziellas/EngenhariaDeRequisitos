import dados from '../data/dados.json'

// Área da cena Sentinel-2 (tile 22KEF). Coordenadas em % da imagem: x da esquerda, y de cima.
export const BBOX = dados.bbox as [number, number, number, number] // oeste, sul, leste, norte
const [W, S, E, N] = BBOX
export type Pct = [number, number]
export type LngLat = [number, number]

export const pctParaLngLat = ([x, y]: Pct): LngLat => [W + (x / 100) * (E - W), N - (y / 100) * (N - S)]
export const lngLatParaPct = ([lng, lat]: LngLat): Pct => [((lng - W) / (E - W)) * 100, ((N - lat) / (N - S)) * 100]
export const dentroDaArea = ([lng, lat]: LngLat) => lng >= W && lng <= E && lat >= S && lat <= N

export const CANTOS_CENA: [LngLat, LngLat, LngLat, LngLat] = [[W, N], [E, N], [E, S], [W, S]]
export const CENTRO: LngLat = [(W + E) / 2, (S + N) / 2]

const R = 6371008.8
const rad = (g: number) => (g * Math.PI) / 180

/** Distância em metros (haversine). */
export function distM(a: LngLat, b: LngLat) {
  const dLat = rad(b[1] - a[1]), dLng = rad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Rumo de a para b em graus (0 = norte). */
export function rumo(a: LngLat, b: LngLat) {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]))
  const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Área de um polígono em hectares (projeção local equiretangular, erro desprezível em poucos km). */
export function areaHa(p: LngLat[]) {
  if (p.length < 3) return 0
  const lat0 = rad(p.reduce((s, q) => s + q[1], 0) / p.length)
  const xy = p.map(([lng, lat]) => [rad(lng) * R * Math.cos(lat0), rad(lat) * R])
  let s = 0
  for (let i = 0; i < xy.length; i++) { const a = xy[i], b = xy[(i + 1) % xy.length]; s += a[0] * b[1] - b[0] * a[1] }
  return Math.abs(s / 2) / 10000
}

export function perimetroKm(p: LngLat[]) {
  let s = 0
  for (let i = 0; i < p.length; i++) s += distM(p[i], p[(i + 1) % p.length])
  return s / 1000
}

export function centroide(p: LngLat[]): LngLat {
  return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]
}

/** Elipse aproximada como polígono (para as manchas detectadas). */
export function elipse(c: Pct, w: number, h: number, n = 28): LngLat[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2
    return pctParaLngLat([c[0] + Math.cos(t) * w, c[1] + Math.sin(t) * h])
  })
}

/** Ponto a uma fração t do caminho (lista de pontos). */
export function aoLongo(caminho: LngLat[], t: number): LngLat {
  const seg = caminho.slice(1).map((b, i) => distM(caminho[i], b))
  const total = seg.reduce((a, b) => a + b, 0)
  let alvo = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < seg.length; i++) {
    if (alvo <= seg[i] || i === seg.length - 1) {
      const f = seg[i] ? Math.min(1, alvo / seg[i]) : 0, a = caminho[i], b = caminho[i + 1]
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    }
    alvo -= seg[i]
  }
  return caminho[caminho.length - 1]
}
