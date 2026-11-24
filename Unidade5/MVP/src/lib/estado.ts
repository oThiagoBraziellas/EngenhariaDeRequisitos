import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ALERTAS, SEDE, TALHOES_BASE, montaTalhao, posAlerta, type Alerta, type Talhao } from './dados'
import { distM, type LngLat, type Pct } from './geo'
import { medeNdvi, type Medida } from './ndvi'

export type Perfil = 'produtor' | 'agronomo' | 'admin'
export const NOME_PERFIL: Record<Perfil, string> = { produtor: 'Produtor', agronomo: 'Agrônomo', admin: 'Administrador' }

export interface Inspecao {
  id: string; alerta: string; talhao: string; achado: string; grav: string; obs: string
  confirmada: boolean; foto?: string; quando: string; st: 'pendente' | 'enviada'; por: string
}
export interface Proprio { id: string; nome: string; cult: 'Soja' | 'Milho'; pct: Pct[]; origem: 'desenho' | 'CAR' }
export interface SafraTalhao { cultura: string; plantio: string; colheita: string }
export interface Membro { id: string; nome: string; contato: string; perfil: Perfil; st: 'convidado' | 'ativo'; desde: string; resumo: boolean }
export interface Registro { quando: string; quem: string; acao: string; ok: boolean }
export interface VersaoModelo { v: string; cultura: string; precisao: number; recall: number; amostras: number; st: 'publicada' | 'candidata' | 'arquivada'; data: string; nota: string }
export interface Msg { de: 'eu' | 'ia'; txt: string }

export interface Estado {
  entrou: boolean
  usuario: { nome: string; contato: string; perfil: Perfil }
  fazenda: { nome: string; mun: string; cult: string[] }
  proprios: Proprio[]
  safras: Record<string, SafraTalhao>
  rota: string[]
  ignorados: string[]
  insp: Inspecao[]
  semSinal: boolean
  notif: { hora: string; push: boolean; whatsapp: boolean; whatsNum: string; email: boolean }
  mapasOff: boolean
  membros: Membro[]
  registros: Registro[]
  modelos: VersaoModelo[]
  passagens: string[]
  chat: Msg[]
}

const CHAVE = 'agroai-mvp-v3'
const agora = () => new Date().toISOString()
const SAFRAS_INI: Record<string, SafraTalhao> = {
  T1: { cultura: 'Soja', plantio: '2025-10-08', colheita: '2026-02-10' },
  T2: { cultura: 'Soja', plantio: '2025-10-05', colheita: '2026-02-05' },
  T3: { cultura: 'Soja', plantio: '2025-10-12', colheita: '2026-02-15' },
  T4: { cultura: 'Milho', plantio: '2025-10-20', colheita: '2026-03-10' },
  T5: { cultura: 'Soja', plantio: '2025-10-10', colheita: '2026-02-12' },
  T6: { cultura: 'Soja', plantio: '2025-10-15', colheita: '2026-02-18' },
}
export const INICIAL: Estado = {
  entrou: false,
  usuario: { nome: 'Thiago', contato: '(64) 99999-0000', perfil: 'produtor' },
  fazenda: { nome: 'Fazenda Boa Vista', mun: 'Rio Verde (GO)', cult: ['Soja', 'Milho'] },
  proprios: [], safras: SAFRAS_INI, rota: ['a1', 'a2', 'a3'], ignorados: [], insp: [], semSinal: false,
  notif: { hora: '06:00', push: false, whatsapp: false, whatsNum: '', email: true }, mapasOff: true,
  membros: [
    { id: 'm1', nome: 'Carla Menezes', contato: 'carla.agro@exemplo.com', perfil: 'agronomo', st: 'ativo', desde: '2025-10-02', resumo: true },
    { id: 'm2', nome: 'Seu João', contato: '(64) 98888-1111', perfil: 'produtor', st: 'ativo', desde: '2025-09-20', resumo: false },
  ],
  registros: [
    { quando: '2025-12-24T21:12:00', quem: 'contato desconhecido', acao: 'tentou abrir a Fazenda Boa Vista sem convite', ok: false },
    { quando: '2025-12-25T07:40:00', quem: 'Carla Menezes', acao: 'abriu os alertas', ok: true },
  ],
  modelos: [
    { v: 'v1.2', cultura: 'Soja', precisao: 0.81, recall: 0.74, amostras: 1240, st: 'publicada', data: '2025-11-28', nota: 'Treinada com a safra 24/25 do Sudoeste goiano' },
    { v: 'v1.1', cultura: 'Soja', precisao: 0.77, recall: 0.70, amostras: 980, st: 'arquivada', data: '2025-09-30', nota: 'Primeira versão regional' },
    { v: 'v0.9', cultura: 'Milho', precisao: 0.69, recall: 0.63, amostras: 410, st: 'publicada', data: '2025-10-15', nota: 'Poucas amostras; confiança baixa vira "verificar em campo"' },
  ],
  passagens: ['20251006', '20251130', '20251225'],
  chat: [],
}

function ler(): Estado {
  try { const s = localStorage.getItem(CHAVE); if (s) return { ...INICIAL, ...JSON.parse(s) } } catch { /* sem armazenamento */ }
  return INICIAL
}

let E = ler()
{ const pf = new URLSearchParams(location.search).get('perfil'); if (pf === 'produtor' || pf === 'agronomo' || pf === 'admin') E = { ...E, usuario: { ...E.usuario, perfil: pf } } }
const ouvintes = new Set<() => void>()
export let avisoArmazenamento = false

export function muda(f: (e: Estado) => Partial<Estado>) {
  E = { ...E, ...f(E) }
  try { localStorage.setItem(CHAVE, JSON.stringify(E)); avisoArmazenamento = false }
  catch { avisoArmazenamento = true }
  ouvintes.forEach(o => o())
}
export function registra(acao: string, ok = true) {
  muda(e => ({ registros: [{ quando: agora(), quem: e.usuario.nome + ' (' + NOME_PERFIL[e.usuario.perfil] + ')', acao, ok }, ...e.registros].slice(0, 200) }))
}
export function zera() { try { localStorage.removeItem(CHAVE) } catch { /* nada */ } E = INICIAL; ouvintes.forEach(o => o()) }
export const estadoAtual = () => E

export const useEstado = () => useSyncExternalStore(cb => { ouvintes.add(cb); return () => ouvintes.delete(cb) }, () => E)

/** Sinal: o aparelho está sem internet de verdade ou o usuário simulou a falta de sinal. */
export function useOnline() {
  const e = useEstado()
  const [rede, setRede] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setRede(true), off = () => setRede(false)
    addEventListener('online', on); addEventListener('offline', off)
    return () => { removeEventListener('online', on); removeEventListener('offline', off) }
  }, [])
  return rede && !e.semSinal
}

/** O que cada perfil pode fazer (RNF04: só quem o produtor autorizou). */
export const pode = (e: Estado, acao: 'editar' | 'campo' | 'gestao' | 'modelos' | 'equipe') => {
  const p = e.usuario.perfil
  if (acao === 'modelos') return p === 'admin'
  if (acao === 'gestao') return p === 'admin'
  if (acao === 'equipe') return p !== 'agronomo'
  if (acao === 'editar') return p !== 'agronomo'
  return true
}

export function talhoes(e: Estado): Talhao[] {
  return TALHOES_BASE.map(t => ({ ...t, cult: (e.safras[t.id]?.cultura as 'Soja' | 'Milho') || t.cult }))
    .concat(e.proprios.map((p, i) => montaTalhao(p.id, 7 + i, p.nome, p.cult, p.pct, { proprio: true })))
}
export const achaTalhao = (e: Estado, id: string) => talhoes(e).find(t => t.id === id)
export const alertasAtivos = (e: Estado) => ALERTAS.filter(a => !e.ignorados.includes(a.id) && e.passagens.includes('20251225'))
export const achaAlerta = (id: string) => ALERTAS.find(a => a.id === id)
export const inspDoAlerta = (e: Estado, id: string) => e.insp.find(i => i.alerta === id)

export interface Parada { a: Alerta; pos: LngLat; m: number }
/** Ordem da rota: testa todas as ordens e fica com a menor distância; prioridade alta cedo pesa a favor. */
export function rotaOrdenada(e: Estado): Parada[] {
  const tal = (id: string) => achaTalhao(e, id)
  const ids = e.rota.filter(id => !e.ignorados.includes(id) && e.passagens.includes('20251225'))
  const peso: Record<string, number> = { alta: 500, 'média': 150, baixa: 0 }
  let melhor: string[] = [], mc = Infinity
  const perm = (arr: string[], k: number) => {
    if (k === arr.length) {
      let c = 0, at = SEDE
      arr.forEach((id, i) => { const a = achaAlerta(id)!, p = posAlerta(a, tal); c += distM(at, p) * 1.25 + peso[a.pri] * i; at = p })
      if (c < mc) { mc = c; melhor = arr.slice() }
      return
    }
    for (let j = k; j < arr.length; j++) { [arr[k], arr[j]] = [arr[j], arr[k]]; perm(arr, k + 1); [arr[k], arr[j]] = [arr[j], arr[k]] }
  }
  perm(ids, 0)
  let at = SEDE
  return melhor.map(id => { const a = achaAlerta(id)!, pos = posAlerta(a, tal), m = distM(at, pos) * 1.25; at = pos; return { a, pos, m } })
}
export const totalM = (r: Parada[]) => r.reduce((s, p) => s + p.m, 0)
export const minutos = (r: Parada[]) => Math.round((totalM(r) / 1000 / 25) * 60 + r.length * 12)

/** Métricas do retorno de campo usadas na recalibração (RF12). */
export function retornoCampo(e: Estado) {
  const conf = e.insp.filter(i => i.confirmada).length, falsos = e.insp.filter(i => !i.confirmada).length
  return { conf, falsos, total: conf + falsos, precisaoCampo: conf + falsos ? conf / (conf + falsos) : null }
}

/** NDVI medido na grade real; null enquanto carrega. */
export function useNdvi(pct: Pct[] | undefined, data: string) {
  const [m, setM] = useState<Medida | null>(null)
  const chave = JSON.stringify(pct) + data
  useEffect(() => {
    let vivo = true
    if (pct) medeNdvi(pct, data).then(r => { if (vivo) setM(r) }).catch(() => { if (vivo) setM(null) })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  return m
}

/** Versões memorizadas (evitam redesenhar o mapa a cada render). */
export function useRotaOrdenada(e: Estado) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => rotaOrdenada(e), [e.rota, e.ignorados, e.proprios, e.passagens])
}
export function useAtivos(e: Estado) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => alertasAtivos(e), [e.ignorados, e.passagens])
}
export function useTalhoes(e: Estado) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => talhoes(e), [e.proprios, e.safras])
}

export const novoId = (p: string) => p + Math.random().toString(36).slice(2, 8)
