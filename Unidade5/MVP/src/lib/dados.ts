import bruto from '../data/dados.json'
import contornos from '../data/talhoes.json'
import { areaHa, centroide, pctParaLngLat, type LngLat, type Pct } from './geo'

export type Prioridade = 'alta' | 'média' | 'baixa'
export interface Clima { d: string; tmax: number; tmin: number; chuva: number; ur: number }
export interface Zona { cx: number; cy: number; ha: number; ndvi: number; ref: number; w: number; h: number }

export const DATAS: string[] = bruto.datas
export const NUVEM: Record<string, number> = bruto.nuvem
export const IMAGENS = bruto.imgs as Record<string, { rgb: string; ndvi: string }>
export const SERIE = bruto.serie as { d: string; A: number; B: number }[]
export const ZONAS = bruto.zonas as Zona[]
export const CLIMA = bruto.clima as Clima[]
export const AGORA = bruto.agora as { t: number; ur: number }
export const FOTO_EXEMPLO = bruto.foto
export const DATA_ATUAL = '20251225'
export const HOJE_TXT = 'Sexta, 26 de dezembro'
export const SEDE: LngLat = pctParaLngLat([76.5, 68.8])

export interface Talhao {
  id: string; num: number; nome: string; cult: 'Soja' | 'Milho'
  pct: Pct[]; contorno: LngLat[]; centro: LngLat; ha: number
  serie?: 'A' | 'B'; zona?: number; proprio?: boolean
}

const META: Record<string, { cult: 'Soja' | 'Milho'; serie?: 'A' | 'B'; zona?: number }> = {
  T1: { cult: 'Soja', serie: 'A' }, T2: { cult: 'Soja', serie: 'B' }, T3: { cult: 'Soja', zona: 0 },
  T4: { cult: 'Milho', zona: 1 }, T5: { cult: 'Soja', zona: 2 }, T6: { cult: 'Soja', zona: 3 },
}

export function montaTalhao(id: string, num: number, nome: string, cult: 'Soja' | 'Milho', pct: Pct[], extra: Partial<Talhao> = {}): Talhao {
  const contorno = pct.map(pctParaLngLat)
  return { id, num, nome, cult, pct, contorno, centro: centroide(contorno), ha: areaHa(contorno), ...extra }
}

export const TALHOES_BASE: Talhao[] = Object.entries(contornos as unknown as Record<string, Pct[]>).map(([id, pct]) =>
  montaTalhao(id, +id.slice(1), 'Talhão ' + id.slice(1), META[id].cult, pct, { serie: META[id].serie, zona: META[id].zona }))

export interface Alerta {
  id: string; t: string; tipo: string; pri: Prioridade; conf: number; hip: string
  z?: number; clima?: boolean
}

export const ALERTAS: Alerta[] = [
  { id: 'a1', t: 'T3', tipo: 'Mancha de vigor baixo', pri: 'alta', z: 0, conf: 74, hip: 'Falha de plantio ou doença no início' },
  { id: 'a2', t: 'T1', tipo: 'Risco de ferrugem-asiática', pri: 'alta', clima: true, conf: 68, hip: 'Clima favorável ao fungo nos últimos dias' },
  { id: 'a3', t: 'T5', tipo: 'Mancha de vigor baixo', pri: 'média', z: 2, conf: 61, hip: 'Falha de plantio ou compactação do solo' },
  { id: 'a4', t: 'T4', tipo: 'Mancha de vigor baixo', pri: 'média', z: 1, conf: 58, hip: 'Possível falta de água localizada' },
  { id: 'a5', t: 'T6', tipo: 'Mancha de vigor baixo', pri: 'baixa', z: 3, conf: 44, hip: 'Variação natural ou falha pequena' },
]

export const ZONA_POS = (z: Zona): Pct => [z.cx, z.cy]
export const posAlerta = (a: Alerta, tal: (id: string) => Talhao | undefined): LngLat =>
  a.z != null ? pctParaLngLat(ZONA_POS(ZONAS[a.z])) : tal(a.t)!.centro

export const diasUmidos = CLIMA.filter(c => c.ur >= 88).length
export const chuva14 = CLIMA.reduce((s, c) => s + c.chuva, 0)

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const dataCurta = (d: string) => d.slice(6, 8) + '/' + d.slice(4, 6)
export const dataLonga = (d: string) => +d.slice(6, 8) + ' ' + MESES[+d.slice(4, 6) - 1] + ' ' + d.slice(0, 4)
export const isoParaD = (iso: string) => iso.replaceAll('-', '')
export const num = (n: number, c = 2) => n.toFixed(c).replace('.', ',')
export const km = (m: number) => num(m / 1000, 1) + ' km'

export const FASES: Record<string, string> = {
  '20251006': 'Plantio', '20251130': 'Emergência', '20251225': 'Pleno vigor',
  '20260116': 'Enchimento', '20260215': 'Colheita', '20260419': 'Safrinha',
}
