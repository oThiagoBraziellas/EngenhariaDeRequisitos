import { useState } from 'react'
import { Pri, aviso } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { ALERTAS, CLIMA, IMAGENS, ZONAS, diasUmidos, num, type Alerta } from '../lib/dados'
import { inspDoAlerta, muda, pode, registra, useAtivos, useEstado, useRotaOrdenada, useTalhoes } from '../lib/estado'
import { vai } from '../lib/rotas'

const B = import.meta.env.BASE_URL
/** Recorte ampliado da cena em volta de um ponto (mesma escala em todas as miniaturas). */
export function recorte(x: number, y: number, k: number, img: string) {
  return { backgroundImage: `url(${B}${img})`, backgroundSize: `${k * 100}% auto`, backgroundPosition: `${(x * k - 50) / (k - 1)}% ${(y * k - 50) / (k - 1)}%` }
}
const ponto = (a: Alerta, ts: ReturnType<typeof useTalhoes>) => {
  if (a.z != null) return { x: ZONAS[a.z].cx, y: ZONAS[a.z].cy }
  const t = ts.find(t => t.id === a.t)!
  return { x: t.pct.reduce((s, p) => s + p[0], 0) / t.pct.length, y: t.pct.reduce((s, p) => s + p[1], 0) / t.pct.length }
}

export function AlertasTela({ id }: { id?: string }) {
  const e = useEstado()
  const ts = useTalhoes(e)
  const ativos = useAtivos(e)
  const [f, setF] = useState<'todos' | 'alta' | 'média' | 'baixa'>('todos')
  const lista = ativos.filter(a => f === 'todos' || a.pri === f)
  const sel = id ? ALERTAS.find(a => a.id === id) : undefined

  return (
    <div className={'pagina alertas' + (sel ? ' com-detalhe' : '')}>
      <section className="alertas-lista">
        <div className="cab"><div><h1>Alertas</h1><p>Gerados pela IA com a imagem de 25/12/2025 e o clima de 13 a 26/12</p></div></div>
        <div className="chips" role="group" aria-label="Filtrar por prioridade">
          {(['todos', 'alta', 'média', 'baixa'] as const).map(x => (
            <button key={x} className="chip" aria-pressed={f === x} onClick={() => setF(x)}>
              {x === 'todos' ? 'Todos' : x[0].toUpperCase() + x.slice(1)} <span className="qt">{x === 'todos' ? ativos.length : ativos.filter(a => a.pri === x).length}</span>
            </button>
          ))}
        </div>
        <ul className="linhas">
          {lista.map(a => {
            const t = ts.find(t => t.id === a.t)!, p = ponto(a, ts), insp = inspDoAlerta(e, a.id)
            return (
              <li key={a.id}>
                <a href={'#/alertas/' + a.id} aria-current={a.id === id ? 'true' : undefined}>
                  <i className="mini" style={recorte(p.x, p.y, 6, IMAGENS['20251225'].ndvi)} />
                  <div className="tx"><b>{a.tipo}</b><span>{t.nome} · {t.cult} · confiança {a.conf}%{e.rota.includes(a.id) ? ' · na rota' : ''}{insp ? ' · inspecionado' : ''}</span></div>
                  <Pri p={a.pri} />
                </a>
              </li>
            )
          })}
          {!lista.length && <li className="nota vazio-linha">Nenhum alerta com esse filtro.</li>}
        </ul>
        {e.ignorados.length > 0 && (
          <p className="nota">{e.ignorados.length} alerta(s) ignorado(s) contam como "não é problema" no treino da IA. <button className="bt bt-t" onClick={() => muda(() => ({ ignorados: [] }))}>Restaurar</button></p>
        )}
      </section>
      {sel ? <Detalhe a={sel} /> : <div className="alertas-vazio painel"><Icone n="alertas" c="g" /><p>Escolha um alerta para ver a evidência e decidir.</p></div>}
    </div>
  )
}

function Detalhe({ a }: { a: Alerta }) {
  const e = useEstado()
  const ts = useTalhoes(e)
  const r = useRotaOrdenada(e)
  const t = ts.find(t => t.id === a.t)!
  const na = e.rota.includes(a.id)
  const insp = inspDoAlerta(e, a.id)
  const ordem = r.findIndex(p => p.a.id === a.id)
  const p = ponto(a, ts)
  const z = a.z != null ? ZONAS[a.z] : null
  const baixa = a.conf < 50
  const alterna = () => {
    muda(x => ({ rota: na ? x.rota.filter(i => i !== a.id) : [...x.rota, a.id] }))
    aviso(na ? 'Tirado da rota de hoje' : 'Incluído na rota de hoje; a ordem foi recalculada')
  }
  const ignorar = () => { muda(x => ({ ignorados: [...x.ignorados, a.id], rota: x.rota.filter(i => i !== a.id) })); registra('ignorou o alerta ' + a.tipo.toLowerCase() + ' do ' + t.nome); aviso('Alerta ignorado. A IA vai levar isso em conta.'); vai('alertas') }

  return (
    <article className="alerta-detalhe" aria-label={a.tipo}>
      <a className="voltar so-cel" href="#/alertas"><Icone n="voltar" c="p" />Alertas</a>
      <div className="cab"><div><h1>{a.tipo}</h1><p>{t.nome} · {t.cult} · <Pri p={a.pri} /></p></div></div>
      {z ? (
        <div className="evidencia">
          <figure><div className="zoom" style={recorte(p.x, p.y, 9, IMAGENS['20251225'].ndvi)}><i style={{ width: `${Math.max(z.w * 9, 6)}%`, height: `${Math.max(z.h * 9, 6)}%` }} /></div><figcaption>Vigor (NDVI) em 25/12</figcaption></figure>
          <figure><div className="zoom" style={recorte(p.x, p.y, 9, IMAGENS['20251225'].rgb)}><i style={{ width: `${Math.max(z.w * 9, 6)}%`, height: `${Math.max(z.h * 9, 6)}%` }} /></div><figcaption>Cor real em 25/12</figcaption></figure>
          <figure><div className="zoom" style={recorte(p.x, p.y, 9, IMAGENS['20251130'].ndvi)}><i style={{ width: `${Math.max(z.w * 9, 6)}%`, height: `${Math.max(z.h * 9, 6)}%` }} /></div><figcaption>Mesmo lugar em 30/11</figcaption></figure>
        </div>
      ) : (
        <div className="painel">
          <div className="barras" role="img" aria-label="Umidade diária de 13 a 26 de dezembro">
            {CLIMA.map(c => <div key={c.d}><i style={{ height: `${(c.ur - 60) * 2.6}px` }} className={c.ur >= 88 ? 'u' : ''} /><span>{c.d.slice(8)}</span></div>)}
          </div>
          <p className="nota">Umidade média diária em Rio Verde, 13 a 26/12/2025 (Open-Meteo). Em destaque: 88% ou mais.</p>
        </div>
      )}
      <dl className="ficha">
        {z ? <>
          <div><dt>Área da mancha</dt><dd>{num(z.ha)} ha</dd></div>
          <div><dt>NDVI da mancha</dt><dd>{num(z.ndvi)}</dd></div>
          <div><dt>Em volta</dt><dd>{num(z.ref)}</dd></div>
          <div><dt>Diferença</dt><dd>{Math.round((1 - z.ndvi / z.ref) * 100)}% abaixo</dd></div>
        </> : <>
          <div><dt>Dias úmidos</dt><dd>{diasUmidos} de 14</dd></div>
          <div><dt>Temperatura</dt><dd>{num(Math.min(...CLIMA.map(c => c.tmin)), 0)} a {num(Math.max(...CLIMA.map(c => c.tmax)), 0)} °C</dd></div>
          <div><dt>Chuva</dt><dd>{num(CLIMA.reduce((s, c) => s + c.chuva, 0), 0)} mm</dd></div>
          <div><dt>Fase da soja</dt><dd>Pleno vigor</dd></div>
        </>}
      </dl>
      <div className="hipotese">
        <b>{baixa ? 'Verificar em campo' : a.hip}</b>
        <div className="conf-rot"><span>Confiança da IA {a.conf}%</span><span className="selo-sim">simulado</span></div>
        <div className="conf"><i style={{ width: a.conf + '%' }} /></div>
        <p>{baixa ? 'Confiança abaixo de 50%: a área entra na rota sem tipo definido (UC02, fluxo A2).' : a.clima ? 'Previsão de praga pela série de NDVI, pelo clima e pelo histórico da região (RF09).' : 'Modelo de visão compara o NDVI com o histórico do talhão (RF07) e classifica o tipo e a severidade (RF08).'} O que você confirmar no campo treina o modelo.</p>
      </div>
      {insp ? (
        <div className="painel inspecionado">
          <b>Inspecionado às {new Date(insp.quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}: {insp.achado}</b>
          <span className="nota">{insp.confirmada ? 'Problema confirmado' : 'Falso positivo'} · {insp.st === 'pendente' ? 'aguardando sinal' : 'enviado'}</span>
          {insp.foto && <img src={insp.foto} alt={'Foto da inspeção no ' + t.nome} />}
        </div>
      ) : pode(e, 'campo') && (
        <div className="bts acoes">
          <button className="bt bt-c" onClick={ignorar}>Ignorar</button>
          <button className={'bt ' + (na ? 'bt-c' : 'bt-a')} onClick={alterna}>{na ? `Tirar da rota (ponto ${ordem + 1})` : 'Incluir na rota de hoje'}</button>
        </div>
      )}
      <div className="bts"><a className="bt bt-t" href={'#/mapa/' + t.id}><Icone n="mapa" c="p" />Ver no mapa</a><a className="bt bt-t" href={'#/talhao/' + t.id}><Icone n="folha" c="p" />Histórico do talhão</a></div>
    </article>
  )
}
