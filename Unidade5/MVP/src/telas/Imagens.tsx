import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { aviso } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { ALERTAS, DATAS, FASES, IMAGENS, NUVEM, SERIE, dataCurta, diasUmidos, num } from '../lib/dados'
import { muda, registra, useEstado, useTalhoes } from '../lib/estado'
import { medeNdvi } from '../lib/ndvi'

// Passagens do Sentinel-2 sobre a fazenda. As 6 com imagem guardada são reais; a de 20/12 mostra o descarte por nuvem (UC02, A1).
const PASSAGENS = [
  ...DATAS.map(d => ({ d, nuvem: NUVEM[d], tem: true })),
  { d: '20251220', nuvem: 81, tem: false },
].sort((a, b) => a.d.localeCompare(b.d))

const PASSOS = [
  'Baixar a cena do Sentinel-2 (tile 22KEF)',
  'Remover as áreas cobertas por nuvem',
  'Calcular o NDVI de cada talhão',
  'Detectar áreas fora do padrão (visão computacional)',
  'Classificar tipo, severidade e confiança',
  'Prever risco de pragas (NDVI + clima + região)',
  'Atualizar a rota do dia e enviar alertas',
]

export function Imagens() {
  const e = useEstado()
  const ts = useTalhoes(e)
  const [rodando, setRodando] = useState<string | null>(null)
  const [passo, setPasso] = useState(-1)
  const [log, setLog] = useState<string[]>([])
  const modelo = e.modelos.find(m => m.st === 'publicada' && m.cultura === 'Soja')
  const proxima = PASSAGENS.find(p => !e.passagens.includes(p.d))

  const processa = async (d: string) => {
    const p = PASSAGENS.find(x => x.d === d)!
    setRodando(d); setLog([]); setPasso(0)
    const espera = (ms: number) => new Promise(r => setTimeout(r, ms))
    const diz = (s: string) => setLog(l => [...l, s])
    await espera(600); diz(`Cena de ${dataCurta(d)} baixada.`); setPasso(1); await espera(700)
    if (p.nuvem > 60) {
      diz(`${p.nuvem}% da fazenda coberta por nuvem: imagem descartada. A rota continua com a última imagem válida (UC02 A1, UC01 A2).`)
      muda(x => ({ passagens: [...x.passagens, d] })); registra('processou a passagem de ' + dataCurta(d) + ' (descartada por nuvem)')
      setPasso(-2); setRodando(null); return
    }
    diz(p.nuvem > 10 ? `${p.nuvem}% de nuvem: pixels cobertos ignorados.` : 'Sem nuvem sobre a fazenda.'); setPasso(2); await espera(500)
    const nd = await Promise.all(ts.map(t => medeNdvi(t.pct, d)))
    diz('NDVI: ' + ts.map((t, i) => `${t.nome} ${nd[i] ? num(nd[i]!.media) : '-'}`).join(' · ')); setPasso(3); await espera(800)
    const novos = d === '20251225' ? ALERTAS.filter(a => a.z != null) : []
    diz(novos.length ? `${novos.length} áreas fora do padrão detectadas (modelo ${modelo?.v}).` : 'Nenhuma área nova fora do padrão.'); setPasso(4); await espera(700)
    if (novos.length) diz(novos.map(a => `${a.t.replace('T', 'Talhão ')}: ${a.tipo.toLowerCase()}, ${a.pri}, ${a.conf}%`).join(' · ') + (novos.some(a => a.conf < 50) ? ' · confiança baixa vira "verificar em campo".' : ''))
    setPasso(5); await espera(700)
    const risco = d === '20251225'
    diz(risco ? `Risco alto de ferrugem-asiática no Talhão 1: ${diasUmidos} de 14 dias com umidade ≥ 88%.` : 'Risco de pragas dentro do normal para a fase ' + FASES[d]?.toLowerCase() + '.'); setPasso(6); await espera(600)
    muda(x => ({ passagens: [...new Set([...x.passagens, d])] }))
    if (risco && e.notif.push && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('AGROAI · alerta grave', { body: 'Risco de ferrugem-asiática no Talhão 1. A rota de hoje já inclui o ponto.' })
      diz('Alerta push enviado (RF13).')
    } else if (risco) diz('Alerta registrado. Ative o push em Perfil para receber no celular (RF13).')
    diz('Rota do dia atualizada.')
    registra('processou a passagem de ' + dataCurta(d))
    setPasso(7); setRodando(null); aviso('Passagem de ' + dataCurta(d) + ' processada')
  }

  return (
    <div className="pagina imagens">
      <div className="cab">
        <div><h1>Imagens e IA</h1><p>Cada passagem do Sentinel-2 vira NDVI, anomalias classificadas e risco de praga, antes de o produtor abrir o app</p></div>
        {proxima && <button className="bt bt-a" disabled={!!rodando} onClick={() => processa(proxima.d)}><Icone n="play" c="p" />Processar passagem de {dataCurta(proxima.d)}</button>}
      </div>
      <div className="imagens-grade">
        <section>
          <h2 className="sec">Passagens sobre a fazenda</h2>
          <ul className="passagens">
            {PASSAGENS.map(p => {
              const feita = e.passagens.includes(p.d), descartada = p.nuvem > 60
              return (
                <li key={p.d} className={(feita ? 'feita ' : '') + (descartada ? 'descartada' : '')}>
                  {p.tem ? <i className="mini" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}${IMAGENS[p.d].rgb})` }} /> : <i className="mini nublada"><Icone n="nuvem" /></i>}
                  <div><b>{dataCurta(p.d)}/{p.d.slice(2, 4)} · {FASES[p.d] || 'Floração'}</b><span>{p.nuvem}% de nuvem · {descartada ? 'descartada' : feita ? 'analisada' : 'na fila'}</span></div>
                  {!feita && <button className="bt bt-c" disabled={!!rodando} onClick={() => processa(p.d)}>Processar</button>}
                  {feita && <span className={'situ ' + (descartada ? 'off' : 'ok')}>{descartada ? 'Descartada' : 'Analisada'}</span>}
                </li>
              )
            })}
          </ul>
          <p className="nota">Além das 6 cenas guardadas, a série de NDVI dos talhões 1 e 2 usa {SERIE.length} passagens sem nuvem entre out/25 e mai/26.</p>
        </section>
        <section className="painel pipeline" aria-live="polite">
          <div className="painel-cab"><h2 className="sec">Processamento (UC02)</h2><span className="nota">Modelo publicado: {modelo ? `${modelo.v} · precisão ${Math.round(modelo.precisao * 100)}% (simulada)` : 'nenhum'}</span></div>
          <ol className="passos">
            {PASSOS.map((s, i) => (
              <li key={s} className={passo === -2 && i > 1 ? 'pulado' : i < passo || passo === 7 ? 'ok' : i === passo ? 'agora' : ''}>
                <b>{i < passo || passo === 7 ? <Icone n="check" c="p" /> : i + 1}</b><span>{s}</span>
                {i === passo && rodando && <motion.i className="girando" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} />}
              </li>
            ))}
          </ol>
          <AnimatePresence>
            {log.length > 0 && <motion.div className="log" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{log.map((l, i) => <p key={i}>{l}</p>)}</motion.div>}
          </AnimatePresence>
          {!log.length && <p className="nota">Escolha uma passagem para ver cada etapa rodar. O NDVI é medido de verdade nas grades da cena; a detecção e a classificação usam as manchas reais de 25/12 com tipo e confiança simulados.</p>}
        </section>
      </div>
    </div>
  )
}
