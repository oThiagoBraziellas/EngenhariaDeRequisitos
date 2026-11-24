import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Icone } from '../comp/Icone'
import { ALERTAS, AGORA, CLIMA, ZONAS, chuva14, diasUmidos, km, num } from '../lib/dados'
import { minutos, muda, rotaOrdenada, talhoes, totalM, useEstado, type Estado } from '../lib/estado'

const SUGESTOES = ['Onde preciso ir hoje?', 'Por que o Talhão 3 está com alerta?', 'Tem risco de ferrugem?', 'Como está o Talhão 1?', 'Vai chover?']

/** Respostas montadas só com os dados da fazenda (sem modelo de linguagem nesta versão). */
function responde(q: string, e: Estado): string {
  const s = q.toLowerCase()
  const ts = talhoes(e), r = rotaOrdenada(e)
  const m = s.match(/talh[aã]o\s*(\d+)/)
  if (m) {
    const t = ts.find(x => x.num === +m[1])
    if (!t) return `Não encontrei o Talhão ${m[1]}. A fazenda tem ${ts.length} talhões.`
    const a = ALERTAS.find(x => x.t === t.id && !e.ignorados.includes(x.id))
    const sf = e.safras[t.id]
    let txt = `${t.nome}: ${sf?.cultura || t.cult}, ${num(t.ha, 1)} ha.`
    if (a?.z != null) { const z = ZONAS[a.z]; txt += ` A IA marcou uma ${a.tipo.toLowerCase()} de ${num(z.ha)} ha com NDVI ${num(z.ndvi)}, contra ${num(z.ref)} em volta (${Math.round((1 - z.ndvi / z.ref) * 100)}% abaixo). Hipótese: ${a.hip.toLowerCase()}, confiança ${a.conf}%.` }
    else if (a?.clima) txt += ` Tem alerta de ${a.tipo.toLowerCase()}: ${diasUmidos} dos últimos 14 dias tiveram umidade de 88% ou mais.`
    else txt += ' Sem alerta na imagem de 25/12.'
    const k = r.findIndex(p => p.a.t === t.id)
    return txt + (k >= 0 ? ` Ele é o ponto ${k + 1} da rota de hoje.` : '')
  }
  if (/rota|onde|ir hoje|visitar/.test(s)) {
    if (!r.length) return 'Hoje não há pontos na rota. A próxima imagem chega em 30/12.'
    return `Hoje são ${r.length} pontos, ${km(totalM(r))} saindo da sede, cerca de ${minutos(r)} min: ` + r.map((p, i) => `${i + 1}) ${ts.find(t => t.id === p.a.t)?.nome}, ${p.a.tipo.toLowerCase()}`).join('; ') + '.'
  }
  if (/ferrugem|praga|fungo|doen/.test(s)) return `Sim, risco alto de ferrugem-asiática no Talhão 1. Foram ${diasUmidos} dias com umidade de 88% ou mais entre 13 e 26/12, com temperatura entre ${num(Math.min(...CLIMA.map(c => c.tmin)), 0)} e ${num(Math.max(...CLIMA.map(c => c.tmax)), 0)} °C, clima que favorece o fungo. Vale olhar o baixeiro das plantas. Recomendação de produto fica com o agrônomo responsável.`
  if (/chuv|clima|tempo|umid|temperatura/.test(s)) return `Agora faz ${num(AGORA.t, 0)}° com ${AGORA.ur}% de umidade. Choveram ${num(chuva14, 0)} mm nos últimos 14 dias. A previsão para os próximos dias entra na versão com servidor.`
  if (/defensivo|produto|aplicar|dose/.test(s)) return 'Não indico defensivo: isso exige receita de um agrônomo responsável (RF27 está fora desta versão). Posso enviar o alerta e as fotos para a sua agrônoma em Equipe.'
  if (/ndvi|vigor/.test(s)) return 'NDVI é um índice de 0 a 1 calculado com a luz vermelha e o infravermelho que a planta reflete. Acima de 0,6 a lavoura está forte; abaixo disso vale olhar. Os valores do app vêm das cenas reais do Sentinel-2.'
  return 'Posso responder sobre a rota de hoje, um talhão (ex.: "como está o Talhão 3?"), risco de pragas, clima e NDVI.'
}

export function Assistente() {
  const e = useEstado()
  const [q, setQ] = useState('')
  const [pensando, setPensando] = useState(false)
  const fim = useRef<HTMLDivElement>(null)
  useEffect(() => { fim.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [e.chat.length, pensando])
  const pergunta = (txt: string) => {
    const t = txt.trim(); if (!t || pensando) return
    muda(x => ({ chat: [...x.chat, { de: 'eu', txt: t }] })); setQ(''); setPensando(true)
    setTimeout(() => { muda(x => ({ chat: [...x.chat, { de: 'ia', txt: responde(t, x) }] })); setPensando(false) }, 650)
  }
  return (
    <div className="pagina estreita assistente">
      <div className="cab"><div><h1>Assistente da lavoura</h1><p>Pergunte sobre a fazenda (RF24) · <span className="selo-sim">respostas montadas com os dados da fazenda, sem modelo de linguagem</span></p></div>
        {e.chat.length > 0 && <button className="bt bt-t" onClick={() => muda(() => ({ chat: [] }))}>Limpar conversa</button>}</div>
      <div className="conversa" aria-live="polite">
        {!e.chat.length && <p className="nota">Experimente uma das perguntas abaixo.</p>}
        {e.chat.map((m, i) => <motion.p key={i} className={'msg ' + m.de} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>{m.txt}</motion.p>)}
        {pensando && <p className="msg ia pensando"><i /><i /><i /></p>}
        <div ref={fim} />
      </div>
      <div className="chips">{SUGESTOES.map(s => <button key={s} className="chip" onClick={() => pergunta(s)}>{s}</button>)}</div>
      <form className="pergunta" onSubmit={ev => { ev.preventDefault(); pergunta(q) }}>
        <label className="sr" htmlFor="q">Pergunta</label>
        <input id="q" className="campo" value={q} onChange={ev => setQ(ev.target.value)} placeholder="Ex.: como está o Talhão 5?" maxLength={200} autoComplete="off" />
        <button className="bt bt-v" disabled={!q.trim() || pensando} aria-label="Enviar pergunta"><Icone n="enviar" c="p" /></button>
      </form>
    </div>
  )
}
