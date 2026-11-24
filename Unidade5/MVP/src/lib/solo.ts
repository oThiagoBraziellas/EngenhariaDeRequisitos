// Uso do solo (RF22) a partir de duas cenas reais: 06/10 (seca, antes do plantio) e 25/12 (lavoura de pé).
// Lavoura anual: solo exposto em outubro e verde em dezembro. Mata/cerrado: verde já na seca. O resto é pasto ou campo.
export const CLASSES = [
  { id: 'lavoura', nome: 'Lavoura anual', cor: [232, 177, 13] },
  { id: 'mata', nome: 'Mata e cerrado nativo', cor: [30, 90, 50] },
  { id: 'pasto', nome: 'Pasto e campo', cor: [160, 190, 110] },
  { id: 'solo', nome: 'Solo exposto, estrada e sede', cor: [156, 58, 34] },
] as const

async function grade(d: string) {
  const im = new Image(); im.src = `${import.meta.env.BASE_URL}grades/${d}.png`
  await im.decode()
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(im, 0, 0)
  return { w: im.width, h: im.height, px: x.getImageData(0, 0, im.width, im.height).data }
}

export interface UsoSolo { url: string; pct: Record<string, number>; ha: Record<string, number> }
let cache: Promise<UsoSolo> | null = null

export function usoDoSolo(): Promise<UsoSolo> {
  if (cache) return cache
  cache = (async () => {
    const [a, b] = await Promise.all([grade('20251006'), grade('20251225')])
    const c = document.createElement('canvas'); c.width = a.w; c.height = a.h
    const x = c.getContext('2d')!, out = x.createImageData(a.w, a.h)
    const n: Record<string, number> = { lavoura: 0, mata: 0, pasto: 0, solo: 0 }
    for (let i = 0; i < a.w * a.h; i++) {
      const out10 = a.px[i * 4] / 250, dez = b.px[i * 4] / 250
      const k = dez < 0.35 ? 'solo' : out10 >= 0.5 ? 'mata' : out10 < 0.3 && dez >= 0.6 ? 'lavoura' : 'pasto'
      n[k]++
      const cor = CLASSES.find(q => q.id === k)!.cor
      out.data.set([cor[0], cor[1], cor[2], 200], i * 4)
    }
    x.putImageData(out, 0, 0)
    const tot = a.w * a.h, haCel = (6356 / a.w) * (5530 / a.h) / 10000
    return {
      url: c.toDataURL('image/png'),
      pct: Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / tot])),
      ha: Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v * haCel])),
    }
  })()
  cache.catch(() => { cache = null })
  return cache
}
