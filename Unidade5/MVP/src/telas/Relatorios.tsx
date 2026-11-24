import { useEffect, useState } from 'react'
import { Icone } from '../comp/Icone'
import { ALERTAS, DATAS, FASES, dataCurta, num } from '../lib/dados'
import { useAtivos, useEstado, useTalhoes } from '../lib/estado'
import { medeNdvi } from '../lib/ndvi'
import { recorte } from './AlertasTela'
import { IMAGENS } from '../lib/dados'

export function Relatorios({ id }: { id?: string }) {
  const e = useEstado()
  const ts = useTalhoes(e)
  const ativos = useAtivos(e)
  const t = ts.find(x => x.id === (id || 'T1')) || ts[0]
  const [serie, setSerie] = useState<(number | null)[]>([])
  useEffect(() => {
    let vivo = true
    Promise.all(DATAS.map(d => medeNdvi(t.pct, d))).then(v => { if (vivo) setSerie(v.map(x => x?.media ?? null)) })
    return () => { vivo = false }
  }, [t])
  const s = e.safras[t.id]
  const al = ativos.filter(a => a.t === t.id)
  const insp = e.insp.filter(i => i.talhao === t.id)
  const xs = t.pct.map(p => p[0]), ys = t.pct.map(p => p[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2

  return (
    <div className="pagina relatorios">
      <div className="cab nao-imprime">
        <div><h1>Relatórios</h1><p>Relatório por talhão em PDF (RF20) e histórico de vigor e ocorrências (RF15)</p></div>
        <button className="bt bt-a" onClick={() => window.print()}><Icone n="impressora" c="p" />Salvar em PDF</button>
      </div>
      <div className="chips nao-imprime" role="group" aria-label="Talhão do relatório">
        {ts.map(x => <a key={x.id} className="chip" aria-pressed={x.id === t.id} href={'#/relatorios/' + x.id}>{x.nome}</a>)}
      </div>
      <article className="folha" aria-label={'Relatório do ' + t.nome}>
        <header className="folha-cab">
          <div><span className="logo-escura" role="img" aria-label="AGROAI" /><h2>Relatório do {t.nome}</h2><p>{e.fazenda.nome} · {e.fazenda.mun} · emitido em 26/12/2025</p></div>
          <b className="num-placa enorme">{String(t.num).padStart(2, '0')}</b>
        </header>
        <dl className="ficha">
          <div><dt>Cultura</dt><dd>{s?.cultura || t.cult}</dd></div>
          <div><dt>Área</dt><dd>{num(t.ha, 1)} ha</dd></div>
          <div><dt>Plantio</dt><dd>{s?.plantio ? s.plantio.split('-').reverse().join('/') : '-'}</dd></div>
          <div><dt>Colheita prevista</dt><dd>{s?.colheita ? s.colheita.split('-').reverse().join('/') : '-'}</dd></div>
        </dl>
        <h3>Vigor nas cenas da safra (NDVI médio)</h3>
        <div className="folha-cenas">
          {DATAS.map((d, i) => (
            <figure key={d}>
              <div className="zoom" style={recorte(cx, cy, 5, IMAGENS[d].ndvi)} />
              <figcaption><b>{serie[i] != null ? num(serie[i]!) : '...'}</b>{dataCurta(d)} · {FASES[d]}</figcaption>
            </figure>
          ))}
        </div>
        <h3>Ocorrências</h3>
        <table className="tabela">
          <thead><tr><th>Data</th><th>Origem</th><th>Descrição</th><th>Resultado</th></tr></thead>
          <tbody>
            {al.map(a => <tr key={a.id}><td>25/12/2025</td><td>IA</td><td>{a.tipo} · prioridade {a.pri} · confiança {a.conf}%</td><td>{insp.find(i => i.alerta === a.id)?.achado || 'aguardando inspeção'}</td></tr>)}
            {ALERTAS.filter(a => a.t === t.id && e.ignorados.includes(a.id)).map(a => <tr key={a.id}><td>25/12/2025</td><td>IA</td><td>{a.tipo}</td><td>ignorado pelo produtor</td></tr>)}
            {insp.map(i => <tr key={i.id}><td>{new Date(i.quando).toLocaleDateString('pt-BR')}</td><td>Campo · {i.por}</td><td>{i.achado}{i.grav !== '-' ? ', gravidade ' + i.grav.toLowerCase() : ''}{i.obs ? '. ' + i.obs : ''}</td><td>{i.confirmada ? 'confirmado' : 'falso positivo'}</td></tr>)}
            {!al.length && !insp.length && <tr><td colSpan={4}>Nenhuma ocorrência nesta safra.</td></tr>}
          </tbody>
        </table>
        <p className="nota">Fonte: Copernicus Sentinel-2 (tile 22KEF), clima Open-Meteo. Classificação da IA simulada nesta versão.</p>
      </article>
    </div>
  )
}
