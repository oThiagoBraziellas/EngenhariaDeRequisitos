import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { DATAS, FASES, IMAGENS, NUVEM, ZONAS, dataCurta, diasUmidos, num, type Alerta, type Prioridade, type Talhao } from '../lib/dados'
import { useNdvi } from '../lib/estado'
import { Icone } from './Icone'

/* Placa de talhão: número em estêncil, cultura, NDVI e a tira de estado. */
export function Placa({ t, alerta, data, rota, onClick, compacta }: {
  t: Talhao; alerta?: Alerta; data: string; rota?: number; onClick?: () => void; compacta?: boolean
}) {
  const m = useNdvi(t.pct, data)
  const pri: Prioridade | 'ok' = alerta ? alerta.pri : 'ok'
  const cls = 'placa ' + (alerta?.clima ? 'tipo-clima' : pri)
  const estado = alerta ? alerta.tipo : 'Sem ocorrência'
  const z = alerta?.z != null ? ZONAS[alerta.z] : null
  const tira = alerta ? (alerta.clima ? 'Alerta de clima' : 'Prioridade ' + alerta.pri) : 'Vigor uniforme'
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={cls + (compacta ? ' compacta' : '')} onClick={onClick} aria-label={onClick ? `${t.nome}, ${t.cult}, ${estado}` : undefined}>
      <div className="face">
        <div className="topo"><span>Talhão</span><span>{t.cult}</span></div>
        <div className="numero" aria-hidden="true">{String(t.num).padStart(2, '0')}</div>
        <div className="base">
          {z ? <>
            <div><b>{estado}</b><span><i>entorno {num(z.ref)}</i> <i>{Math.round((1 - z.ndvi / z.ref) * 100)}% abaixo</i></span></div>
            <div className="nd"><small>NDVI da mancha</small><strong>{num(z.ndvi)}</strong></div>
          </> : alerta?.clima ? <>
            <div><b>{estado}</b><span><i>{diasUmidos} de 14 dias úmidos</i></span></div>
            <div className="nd"><small>NDVI médio</small><strong>{m ? num(m.media) : <i className="carrega" />}</strong></div>
          </> : <>
            <div><b>{estado}</b><span><i>{num(t.ha, 1)} ha</i>{m && <> <i>{Math.round(m.baixo * 100)}% abaixo de 0,6</i></>}</span></div>
            <div className="nd"><small>NDVI médio</small><strong>{m ? num(m.media) : <i className="carrega" />}</strong></div>
          </>}
        </div>
      </div>
      <motion.div className="tira" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }} key={tira}>
        <span>{tira}</span><span>{rota ? `Ponto ${rota} da rota` : alerta ? 'Fora da rota' : 'Acompanhar'}</span>
      </motion.div>
    </Tag>
  )
}

export function Pri({ p }: { p: Prioridade }) { return <span className={'pri ' + p}>{p}</span> }

/* Linha do tempo da safra: as 6 cenas reais, mesma escala e mesmo enquadramento, com reprodução. */
export function Safra({ data, camada, onData, recorte }: {
  data: string; camada: 'ndvi' | 'rgb'; onData: (d: string) => void; recorte?: { x: number; y: number; k: number }
}) {
  const [tocando, setTocando] = useState(false)
  const [prog, setProg] = useState(0)
  const ref = useRef({ data, onData }); ref.current = { data, onData }
  useEffect(() => {
    if (!tocando) return
    const passo = 1800, t0 = performance.now(); let raf = 0
    const tick = (t: number) => {
      const f = ((t - t0) % passo) / passo; setProg(f)
      if (t - t0 >= passo) { const i = DATAS.indexOf(ref.current.data); ref.current.onData(DATAS[(i + 1) % DATAS.length]); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [tocando, data])
  const i = DATAS.indexOf(data)
  const bg = (d: string) => recorte
    ? { backgroundImage: `url(${import.meta.env.BASE_URL}${IMAGENS[d][camada]})`, backgroundSize: `${recorte.k * 100}%`, backgroundPosition: `${(recorte.x * recorte.k - 50) / (recorte.k - 1)}% ${(recorte.y * recorte.k - 50) / (recorte.k - 1)}%` }
    : { backgroundImage: `url(${import.meta.env.BASE_URL}${IMAGENS[d][camada]})` }
  return (
    <div className="safra">
      <div className="t">
        <button className="play" onClick={() => { setTocando(!tocando); setProg(0) }} aria-label={tocando ? 'Pausar a safra' : 'Tocar a safra'}>
          <Icone n={tocando ? 'pausa' : 'play'} c="p" />
        </button>
        <div><b>Safra 2025/26 · {FASES[data]}</b><br /><span>Cena de {dataCurta(data)}/{data.slice(2, 4)} · Sentinel-2{NUVEM[data] > 10 ? ` · ${NUVEM[data]}% de nuvem` : ''}</span></div>
      </div>
      <div className="quadros" role="group" aria-label="Datas da safra">
        {DATAS.map(d => (
          <button key={d} className="quadro" style={bg(d)} aria-pressed={d === data} onClick={() => { setTocando(false); onData(d) }} aria-label={`${FASES[d]}, ${dataCurta(d)}`}>
            {NUVEM[d] > 10 && <em><Icone n="nuvem" c="p" /></em>}
            <span>{dataCurta(d)}</span>
          </button>
        ))}
      </div>
      <div className="progresso"><i style={{ width: `${((i + (tocando ? prog : 0)) / (DATAS.length - 1)) * 100}%`, maxWidth: '100%' }} /></div>
    </div>
  )
}

/* Curva de NDVI: a linha se desenha, os pontos mostram o valor. */
export function Curva({ pts, comp, sel, onSel, nome, nomeComp }: {
  pts: { d: string; v: number }[]; comp?: { d: string; v: number }[]; sel: number; onSel: (i: number) => void; nome: string; nomeComp?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [W, setW] = useState(640)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const ro = new ResizeObserver(() => setW(Math.max(300, Math.round(el.clientWidth))))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  const H = W < 460 ? 200 : 230, x0 = +new Date('2025-10-01'), x1 = +new Date('2026-05-10')
  const X = (d: string) => 36 + ((+new Date(d) - x0) / (x1 - x0)) * (W - 52)
  const Y = (v: number) => 14 + (1 - v) * (H - 44)
  const linha = (s: { d: string; v: number }[]) => s.map((p, i) => (i ? 'L' : 'M') + X(p.d).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' ')
  const meses: [string, string][] = [['2025-10-01', 'out'], ['2025-11-01', 'nov'], ['2025-12-01', 'dez'], ['2026-01-01', 'jan'], ['2026-02-01', 'fev'], ['2026-03-01', 'mar'], ['2026-04-01', 'abr'], ['2026-05-01', 'mai']]
  const p = pts[sel]
  return (
    <figure className="curva" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Curva de NDVI do ${nome}`}>
        {[0.25, 0.5, 0.75].map(v => <g key={v}><line x1={36} x2={W - 16} y1={Y(v)} y2={Y(v)} className="gl" /><text x={30} y={Y(v) + 4} textAnchor="end" className="gt">{num(v)}</text></g>)}
        <rect x={36} y={Y(0.6)} width={W - 52} height={Y(0) - Y(0.6) + 0} className="faixa-baixa" />
        {meses.map(([d, m]) => <text key={d} x={X(d)} y={H - 8} className="gt">{m}</text>)}
        <line x1={X('2025-12-26')} x2={X('2025-12-26')} y1={8} y2={H - 26} className="hoje" />
        <text x={X('2025-12-26') + 5} y={18} className="gt forte">hoje</text>
        {comp && <path d={linha(comp)} className="lc" />}
        <motion.path d={linha(pts)} className="lp" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} key={nome} />
        {pts.map((q, i) => (
          <circle key={i} cx={X(q.d)} cy={Y(q.v)} r={i === sel ? 7 : 4.5} className={'gp' + (i === sel ? ' sel' : '')}
            tabIndex={0} role="button" aria-label={`${q.d}: NDVI ${num(q.v)}`} onClick={() => onSel(i)} onKeyDown={e => e.key === 'Enter' && onSel(i)} />
        ))}
      </svg>
      <figcaption>
        <span className="lg"><i className="l1" />{nome}</span>
        {nomeComp && <span className="lg"><i className="l2" />{nomeComp}</span>}
        <span className="lg"><i className="l3" />abaixo de 0,6</span>
        {p && <strong className="valor">{p.d.split('-').reverse().join('/')} · NDVI {num(p.v)}</strong>}
      </figcaption>
    </figure>
  )
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null
  return <motion.div className="toast" role="status" initial={{ opacity: 0, y: 12, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }}>{msg}</motion.div>
}

let avisar: (m: string) => void = () => {}
export const aviso = (m: string) => avisar(m)
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let t = 0
    avisar = m => { setMsg(m); clearTimeout(t); t = window.setTimeout(() => setMsg(null), 2800) }
    return () => clearTimeout(t)
  }, [])
  return msg
}
