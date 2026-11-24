import { useEffect, useMemo, useState } from 'react'
import { CLASSES, usoDoSolo, type UsoSolo } from '../lib/solo'
import { AnimatePresence, motion } from 'motion/react'
import { Mapa } from '../comp/Mapa'
import { Placa, Safra } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { DATA_ATUAL, ZONAS, ZONA_POS, type Prioridade } from '../lib/dados'
import { useAtivos, useEstado, useRotaOrdenada, useTalhoes } from '../lib/estado'
import { pctParaLngLat } from '../lib/geo'
import { vai } from '../lib/rotas'

export function MapaTela({ sel }: { sel?: string }) {
  const e = useEstado()
  const ts = useTalhoes(e)
  const ativos = useAtivos(e)
  const r = useRotaOrdenada(e)
  const [data, setData] = useState(DATA_ATUAL)
  const [camada, setCamada] = useState<'ndvi' | 'rgb'>('ndvi')
  const [extra, setExtra] = useState<'solo' | 'relevo' | null>(null)
  const [solo, setSolo] = useState<UsoSolo | null>(null)
  useEffect(() => { if (extra === 'solo' && !solo) usoDoSolo().then(setSolo).catch(() => setExtra(null)) }, [extra, solo])
  const pri = useMemo(() => Object.fromEntries(ativos.map(a => [a.t, a.pri])) as Record<string, Prioridade>, [ativos])
  // as manchas foram detectadas na cena de 25/12; aparecem nas datas em que a lavoura está de pé
  const manchas = useMemo(() => (data >= '20251225' && data <= '20260116')
    ? ativos.filter(a => a.z != null).map(a => pctParaLngLat(ZONA_POS(ZONAS[a.z!]))) : [], [ativos, data])
  const t = ts.find(x => x.id === sel)
  const alerta = t && ativos.find(a => a.t === t.id)
  const ordem = t ? r.findIndex(p => p.a.t === t.id) : -1

  return (
    <div className="tela-mapa">
      <Mapa data={data} camada={camada} talhoes={ts} priPorTalhao={pri} sel={sel} manchas={manchas}
        onTalhao={id => vai('mapa/' + id)} enquadrar={t?.contorno} folga={t ? 360 : 0} extra={extra} soloUrl={solo?.url} />
      <div className="mapa-sobre mapa-ctl">
        <div className="seg" role="group" aria-label="Camada">
          <button aria-pressed={!extra && camada === 'ndvi'} onClick={() => { setExtra(null); setCamada('ndvi') }}>Vigor (NDVI)</button>
          <button aria-pressed={!extra && camada === 'rgb'} onClick={() => { setExtra(null); setCamada('rgb') }}>Cor real</button>
          <button aria-pressed={extra === 'solo'} onClick={() => setExtra('solo')}>Uso do solo</button>
          <button aria-pressed={extra === 'relevo'} onClick={() => setExtra('relevo')}>Relevo</button>
        </div>
        {!extra && camada === 'ndvi' && <div className="legenda"><span>0</span><i /><span>0,9</span></div>}
        {extra === 'solo' && <div className="legenda solo">{solo ? CLASSES.map(c => <span key={c.id}><b style={{ background: `rgb(${c.cor.join(',')})` }} />{c.nome} {Math.round(solo.pct[c.id] * 100)}%</span>) : 'Calculando...'}</div>}
        {extra === 'relevo' && <div className="legenda">Sombreamento do terreno · Terrain Tiles</div>}
        <a className="bt bt-c bt-desenhar" href="#/desenhar"><Icone n="lapis" c="p" />Desenhar talhão</a>
      </div>
      {!extra && <div className="mapa-sobre mapa-safra"><Safra data={data} camada={camada} onData={setData} /></div>}
      <AnimatePresence>
        {t && (
          <motion.aside key={t.id} className="mapa-sobre gaveta" aria-label={t.nome}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
            <button className="fechar" onClick={() => vai('mapa')} aria-label="Fechar"><Icone n="x" /></button>
            <Placa t={t} data={data} alerta={alerta} rota={ordem >= 0 ? ordem + 1 : undefined} compacta />
            <div className="bts"><a className="bt bt-v" href={'#/talhao/' + t.id}>Ver talhão</a>{alerta && <a className="bt bt-c" href={'#/alertas/' + alerta.id}>Ver alerta</a>}</div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
