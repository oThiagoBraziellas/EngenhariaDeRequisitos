import { useEffect, useMemo, useState } from 'react'
import { Mapa } from '../comp/Mapa'
import { Curva, Placa, Pri, Safra, aviso } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { DATAS, DATA_ATUAL, FASES, SERIE, num } from '../lib/dados'
import { muda, useAtivos, useEstado, useNdvi, useRotaOrdenada, useTalhoes } from '../lib/estado'
import { medeNdvi } from '../lib/ndvi'
import { perimetroKm } from '../lib/geo'
import { vai } from '../lib/rotas'

export function TalhaoTela({ id }: { id: string }) {
  const e = useEstado()
  const ts = useTalhoes(e)
  const ativos = useAtivos(e)
  const r = useRotaOrdenada(e)
  const t = ts.find(x => x.id === id)
  const [data, setData] = useState(DATA_ATUAL)
  const [camada, setCamada] = useState<'ndvi' | 'rgb'>('ndvi')
  const [serie6, setSerie6] = useState<{ d: string; v: number }[] | null>(null)
  const m = useNdvi(t?.pct, data)

  // série: os talhões 1 e 2 têm 25 cenas medidas; os outros usam as 6 cenas reais lidas da grade
  useEffect(() => {
    if (!t || t.serie) return
    let vivo = true
    Promise.all(DATAS.map(d => medeNdvi(t.pct, d))).then(v => {
      if (vivo) setSerie6(DATAS.map((d, i) => ({ d: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`, v: v[i]?.media ?? 0 })))
    })
    return () => { vivo = false }
  }, [t])
  const pts = useMemo(() => t?.serie ? SERIE.map(s => ({ d: s.d, v: s[t.serie!] })) : serie6 || [], [t, serie6])
  const comp = useMemo(() => t?.serie ? SERIE.map(s => ({ d: s.d, v: s[t.serie === 'A' ? 'B' : 'A'] })) : undefined, [t])
  const [sel, setSel] = useState(-1)
  const iSel = sel >= 0 ? sel : Math.max(0, pts.findIndex(p => p.d >= '2025-12-25'))

  if (!t) return <div className="pagina"><p className="nota">Talhão não encontrado. <a href="#/mapa">Voltar ao mapa</a></p></div>
  const alerta = ativos.find(a => a.t === t.id)
  const ordem = r.findIndex(p => p.a.t === t.id)
  const xs = t.pct.map(p => p[0]), ys = t.pct.map(p => p[1])
  const recorte = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2, k: Math.min(6, 100 / Math.max(Math.max(...xs) - Math.min(...xs), (Math.max(...ys) - Math.min(...ys)) * 1.2) * 0.8) }
  const excluir = () => { muda(x => ({ proprios: x.proprios.filter(p => p.id !== t.id) })); aviso(t.nome + ' excluído'); vai('mapa') }

  return (
    <div className="pagina talhao">
      <a className="voltar" href={'#/mapa/' + t.id}><Icone n="voltar" c="p" />Mapa</a>
      <div className="talhao-grade">
        <div className="talhao-placa">
          <Placa t={t} data={data} alerta={alerta} rota={ordem >= 0 ? ordem + 1 : undefined} />
          <dl className="ficha">
            <div><dt>Área</dt><dd>{num(t.ha, 1)} ha</dd></div>
            <div><dt>Perímetro</dt><dd>{num(perimetroKm(t.contorno), 2)} km</dd></div>
            <div><dt>NDVI mínimo</dt><dd>{m ? num(m.min) : '...'}</dd></div>
            <div><dt>Abaixo de 0,6</dt><dd>{m ? Math.round(m.baixo * 100) + '%' : '...'}</dd></div>
          </dl>
          <p className="nota">Medido na cena de {data.slice(6)}/{data.slice(4, 6)} ({FASES[data].toLowerCase()}), {m ? m.celulas : '...'} células de 20 m dentro do contorno.</p>
          {t.proprio && <button className="bt bt-t" onClick={excluir}><Icone n="lixo" c="p" />Excluir talhão</button>}
        </div>
        <div className="talhao-centro">
          <section className="painel">
            <div className="painel-cab"><h2 className="sec">Vigor ao longo da safra</h2><span className="nota">{t.serie ? '25 cenas medidas' : '6 cenas lidas da grade real'}</span></div>
            {pts.length ? <Curva pts={pts} comp={comp} sel={iSel} onSel={setSel} nome={t.nome} nomeComp={comp ? (t.serie === 'A' ? 'Talhão 2' : 'Talhão 1') : undefined} /> : <div className="esqueleto" style={{ height: 230 }} />}
          </section>
          <div className="talhao-mapa">
            <Mapa data={data} camada={camada} talhoes={[t]} priPorTalhao={alerta ? { [t.id]: alerta.pri } : {}} sel={t.id} enquadrar={t.contorno} rotulo={'Mapa do ' + t.nome} />
            <div className="mapa-sobre mapa-ctl"><div className="seg" role="group" aria-label="Camada">
              <button aria-pressed={camada === 'ndvi'} onClick={() => setCamada('ndvi')}>NDVI</button>
              <button aria-pressed={camada === 'rgb'} onClick={() => setCamada('rgb')}>Cor real</button>
            </div></div>
          </div>
          <Safra data={data} camada={camada} onData={setData} recorte={recorte} />
        </div>
        <aside className="talhao-lado">
          <h2 className="sec">Alertas deste talhão</h2>
          {alerta ? (
            <a className="painel alerta-cartao" href={'#/alertas/' + alerta.id}>
              <div className="painel-cab"><b>{alerta.tipo}</b><Pri p={alerta.pri} /></div>
              <p>{alerta.hip}</p>
              <span className="nota">{ordem >= 0 ? `Ponto ${ordem + 1} da rota de hoje` : 'Fora da rota de hoje'}</span>
            </a>
          ) : <p className="nota painel">Nenhum alerta. A IA olha de novo na próxima imagem, em 30/12.</p>}
        </aside>
      </div>
    </div>
  )
}
