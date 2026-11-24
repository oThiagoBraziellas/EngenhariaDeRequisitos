import { useState } from 'react'
import { Placa, aviso } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { DATA_ATUAL, num } from '../lib/dados'
import { muda, pode, registra, useAtivos, useEstado, useTalhoes, type SafraTalhao } from '../lib/estado'
import { vai } from '../lib/rotas'

const CULTURAS = ['Soja', 'Milho', 'Algodão', 'Feijão', 'Sorgo']
const brData = (iso: string) => iso ? iso.split('-').reverse().join('/') : '-'

export function Talhoes() {
  const e = useEstado()
  const ts = useTalhoes(e)
  const ativos = useAtivos(e)
  const [editando, setEditando] = useState<string | null>(null)
  const area = ts.reduce((s, t) => s + t.ha, 0)
  const editar = pode(e, 'editar')

  return (
    <div className="pagina talhoes">
      <div className="cab">
        <div><h1>Talhões e safras</h1><p>{ts.length} talhões · {num(area, 1)} ha monitorados · safra 2025/26</p></div>
        {editar && <a className="bt bt-a" href="#/desenhar"><Icone n="lapis" c="p" />Desenhar ou importar talhão</a>}
      </div>
      <div className="tabela-rolagem">
        <table className="tabela">
          <thead><tr><th>Talhão</th><th>Cultura</th><th>Área</th><th>Plantio</th><th>Colheita prevista</th><th>Origem</th><th>Situação</th><th><span className="sr">Ações</span></th></tr></thead>
          <tbody>
            {ts.map(t => {
              const s = e.safras[t.id], a = ativos.find(x => x.t === t.id)
              const prop = e.proprios.find(p => p.id === t.id)
              return editando === t.id
                ? <EditaSafra key={t.id} id={t.id} nome={t.nome} s={s || { cultura: t.cult, plantio: '', colheita: '' }} fim={() => setEditando(null)} />
                : (
                  <tr key={t.id}>
                    <td><button className="link-tal" onClick={() => vai('talhao/' + t.id)}><b className="num-placa">{String(t.num).padStart(2, '0')}</b>{t.nome}</button></td>
                    <td>{s?.cultura || t.cult}</td>
                    <td className="n">{num(t.ha, 1)} ha</td>
                    <td>{brData(s?.plantio || '')}</td>
                    <td>{brData(s?.colheita || '')}</td>
                    <td>{prop ? (prop.origem === 'CAR' ? 'Importado do CAR' : 'Desenhado') : 'Cadastro inicial'}</td>
                    <td>{a ? <span className={'pri ' + a.pri}>{a.tipo}</span> : <span className="nota">Sem ocorrência</span>}</td>
                    <td className="acoes-linha">{editar && <button className="bt bt-t" onClick={() => setEditando(t.id)}>Editar safra</button>}</td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      </div>
      <h2 className="sec">Placas</h2>
      <div className="grade-placas">
        {ts.map(t => <Placa key={t.id} t={t} data={DATA_ATUAL} alerta={ativos.find(a => a.t === t.id)} onClick={() => vai('talhao/' + t.id)} />)}
      </div>
    </div>
  )
}

function EditaSafra({ id, nome, s, fim }: { id: string; nome: string; s: SafraTalhao; fim: () => void }) {
  const [v, setV] = useState(s)
  const erro = v.plantio && v.colheita && v.colheita <= v.plantio ? 'A colheita precisa vir depois do plantio.' : ''
  const salva = () => {
    if (erro) return
    muda(x => ({ safras: { ...x.safras, [id]: v } }))
    registra('alterou a safra do ' + nome + ' para ' + v.cultura.toLowerCase())
    aviso('Safra do ' + nome + ' salva'); fim()
  }
  return (
    <tr className="editando">
      <td><b>{nome}</b></td>
      <td><div className="chips">{CULTURAS.map(c => <button key={c} className="chip pq" aria-pressed={v.cultura === c} onClick={() => setV({ ...v, cultura: c })}>{c}</button>)}</div></td>
      <td />
      <td><input type="date" className="campo" aria-label="Plantio" value={v.plantio} onChange={e => setV({ ...v, plantio: e.target.value })} /></td>
      <td><input type="date" className="campo" aria-label="Colheita prevista" value={v.colheita} onChange={e => setV({ ...v, colheita: e.target.value })} />{erro && <p className="erro" role="alert">{erro}</p>}</td>
      <td colSpan={2}><span className="nota">{v.cultura !== 'Soja' && v.cultura !== 'Milho' ? 'Sem modelo treinado para esta cultura: a IA marca só pela queda de NDVI (UC02, A3).' : ''}</span></td>
      <td className="acoes-linha"><button className="bt bt-c" onClick={fim}>Cancelar</button><button className="bt bt-v" disabled={!!erro} onClick={salva}>Salvar</button></td>
    </tr>
  )
}
