import type { Pct } from './geo'

// Grades reais de NDVI (valor × 250, 325 × 271 células de ~20 m), recuperadas das cenas Sentinel-2.
interface Grade { w: number; h: number; v: Uint8Array }
const cache = new Map<string, Promise<Grade>>()

function carrega(data: string): Promise<Grade> {
  let p = cache.get(data)
  if (!p) {
    p = new Promise((ok, erro) => {
      const im = new Image()
      im.onload = () => {
        const c = document.createElement('canvas'); c.width = im.width; c.height = im.height
        const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(im, 0, 0)
        const px = x.getImageData(0, 0, c.width, c.height).data, v = new Uint8Array(c.width * c.height)
        for (let i = 0; i < v.length; i++) v[i] = px[i * 4]
        ok({ w: c.width, h: c.height, v })
      }
      im.onerror = () => { cache.delete(data); erro(new Error('grade ' + data)) }
      im.src = `${import.meta.env.BASE_URL}grades/${data}.png`
    })
    cache.set(data, p)
  }
  return p
}

export interface Medida { media: number; min: number; baixo: number; celulas: number }

/** NDVI médio, mínimo e fração abaixo de 0,6 dentro do polígono (em % da cena). */
export async function medeNdvi(pct: Pct[], data: string): Promise<Medida | null> {
  if (pct.length < 3) return null
  const g = await carrega(data)
  const c = document.createElement('canvas'); c.width = g.w; c.height = g.h
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.beginPath(); pct.forEach((q, i) => x[i ? 'lineTo' : 'moveTo']((q[0] / 100) * g.w, (q[1] / 100) * g.h)); x.closePath(); x.fill()
  const m = x.getImageData(0, 0, g.w, g.h).data
  let s = 0, n = 0, b = 0, mn = 1
  for (let i = 0; i < g.w * g.h; i++) if (m[i * 4 + 3] > 127) { const v = g.v[i] / 250; s += v; n++; if (v < 0.6) b++; if (v < mn) mn = v }
  return n ? { media: s / n, min: mn, baixo: b / n, celulas: n } : null
}
