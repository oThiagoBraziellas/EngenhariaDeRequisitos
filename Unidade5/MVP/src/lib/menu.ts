import { pode, type Estado } from './estado'

type Item = { id: string; nome: string; ic: string; ve?: (e: Estado) => boolean }
export const GRUPOS: { nome: string; itens: Item[] }[] = [
  { nome: 'Campo', itens: [{ id: 'hoje', nome: 'Hoje', ic: 'hoje' }, { id: 'mapa', nome: 'Mapa', ic: 'mapa' }, { id: 'rota', nome: 'Rota do dia', ic: 'rota' }, { id: 'alertas', nome: 'Alertas', ic: 'alertas' }] },
  { nome: 'Fazenda', itens: [{ id: 'talhoes', nome: 'Talhões e safras', ic: 'folha' }, { id: 'imagens', nome: 'Imagens e IA', ic: 'camada' }, { id: 'relatorios', nome: 'Relatórios', ic: 'baixar' }, { id: 'assistente', nome: 'Assistente', ic: 'chat' }] },
  { nome: 'Gestão', itens: [{ id: 'equipe', nome: 'Equipe e convites', ic: 'equipe', ve: e => pode(e, 'equipe') }, { id: 'modelos', nome: 'Modelos de IA', ic: 'modelo', ve: e => pode(e, 'modelos') }, { id: 'usuarios', nome: 'Usuários e acesso', ic: 'cadeado', ve: e => pode(e, 'gestao') }] },
]
