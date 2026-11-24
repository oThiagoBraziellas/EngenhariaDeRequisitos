import { useEffect, useMemo, useRef, useState } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { Mapa } from '../comp/Mapa'
import { Pri, aviso } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { ALERTAS, DATA_ATUAL, FOTO_EXEMPLO, SEDE, km } from '../lib/dados'
import { inspDoAlerta, minutos, muda, novoId, retornoCampo, totalM, useAtivos, useEstado, useOnline, useRotaOrdenada, useTalhoes, type Estado } from '../lib/estado'
import { aoLongo, distM, dentroDaArea, rumo, type LngLat } from '../lib/geo'
import { vai } from '../lib/rotas'

/* ---------------- Rota do dia (UC01, RF10) ---------------- */
export function RotaTela() {
  const e = useEstado()
  const ts = useTalhoes(e)
  const ativos = useAtivos(e)
  const r = useRotaOrdenada(e)
  const fora = ativos.filter(a => !e.rota.includes(a.id))
  const [mudou, setMudou] = useState<string | null>(null)
  const rotaMapa = useMemo(() => ({ sede: SEDE, paradas: r.map(p => ({ pos: p.pos, pri: p.a.pri, feita: !!inspDoAlerta(e, p.a.id) })) }), [r, e])
  const nomeT = (id: string) => ts.find(t => t.id === id)?.nome
  const inclui = (id: string) => { muda(x => ({ rota: [...x.rota, id] })); setMudou(id); setTimeout(() => setMudou(null), 2400) }
  const tira = (id: string) => muda(x => ({ rota: x.rota.filter(i => i !== id) }))
  const primeiroAberto = r.findIndex(p => !inspDoAlerta(e, p.a.id))

  return (
    <div className="tela-rota">
      <div className="rota-mapa"><Mapa data={DATA_ATUAL} camada="rgb" talhoes={ts} rota={rotaMapa} rotulo="Mapa com a rota de hoje" /></div>
      <section className="rota-lado">
        <div className="cab"><div><h1>Rota do dia</h1><p>Saindo da sede · ordem pelo menor caminho, puxando a prioridade alta para o começo</p></div></div>
        <div className="numeros-grandes">
          <div><strong>{r.length}</strong><span>pontos</span></div>
          <div><strong>{km(totalM(r)).replace(' km', '')}</strong><span>km pela estrada</span></div>
          <div><strong>~{minutos(r)}</strong><span>min com inspeções</span></div>
        </div>
        {!r.length && <div className="painel vazio-pq"><b>Nada para visitar hoje</b><p className="nota">Sem pontos críticos na rota. A próxima imagem do Sentinel-2 chega em 30/12 (UC01, fluxo A1).</p></div>}
        <LayoutGroup>
          <ol className="paradas grande">
            {r.map((p, i) => {
              const feita = inspDoAlerta(e, p.a.id)
              return (
                <motion.li layout key={p.a.id} transition={{ type: 'spring', stiffness: 420, damping: 36 }} className={(mudou === p.a.id ? 'mudou ' : '') + (feita ? 'feita' : '')}>
                  <b className={'num-placa ' + p.a.pri}>{feita ? <Icone n="check" c="p" /> : i + 1}</b>
                  <div><b>{nomeT(p.a.t)} · {p.a.tipo.toLowerCase()}</b><span>+{km(p.m)} · <Pri p={p.a.pri} />{mudou === p.a.id ? ' · novo na rota' : ''}{feita ? ' · ' + feita.achado.toLowerCase() : ''}</span></div>
                  <button className="x" onClick={() => tira(p.a.id)} aria-label={'Tirar ' + nomeT(p.a.t) + ' da rota'}><Icone n="x" c="p" /></button>
                </motion.li>
              )
            })}
          </ol>
        </LayoutGroup>
        <button className="bt bt-a largo" disabled={primeiroAberto < 0} onClick={() => vai('navegar/' + primeiroAberto)}>
          {primeiroAberto <= 0 ? 'Iniciar rota' : `Continuar do ponto ${primeiroAberto + 1}`}
        </button>
        {fora.length > 0 && <>
          <h2 className="sec">Fora da rota</h2>
          <ul className="paradas fora">
            {fora.map(a => <li key={a.id}><Pri p={a.pri} /><div><b>{nomeT(a.t)} · {a.tipo.toLowerCase()}</b><span>confiança {a.conf}%</span></div><button className="bt bt-c" onClick={() => inclui(a.id)}><Icone n="mais" c="p" />Incluir</button></li>)}
          </ul>
        </>}
        <p className="nota">Distância pela estrada estimada em 1,25 vez a linha reta. A rota fica guardada no aparelho para usar sem sinal.</p>
      </section>
    </div>
  )
}

/* ---------------- A caminho do ponto (RF14) ---------------- */
export function Navegar({ i }: { i: number }) {
  const e = useEstado()
  const ts = useTalhoes(e)
  const r = useRotaOrdenada(e)
  const x = r[Math.min(i, r.length - 1)]
  const de = i === 0 ? SEDE : r[i - 1]?.pos || SEDE
  const [eu, setEu] = useState<LngLat>(de)
  const [modo, setModo] = useState<'procurando' | 'gps' | 'simulado' | 'negado'>('procurando')
  const [t, setT] = useState(0)

  useEffect(() => {
    if (!('geolocation' in navigator)) { setModo('simulado'); return }
    const w = navigator.geolocation.watchPosition(
      p => { const ll: LngLat = [p.coords.longitude, p.coords.latitude]; if (dentroDaArea(ll)) { setModo('gps'); setEu(ll) } else setModo(m => m === 'gps' ? m : 'simulado') },
      () => setModo('negado'), { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 })
    const tm = setTimeout(() => setModo(m => m === 'procurando' ? 'simulado' : m), 4000)
    return () => { navigator.geolocation.clearWatch(w); clearTimeout(tm) }
  }, [])
  // fora da fazenda de exemplo, o trajeto é simulado ao longo do caminho
  useEffect(() => {
    if (modo !== 'simulado' && modo !== 'negado') return
    if (!x) return
    let raf = 0; const t0 = performance.now(), dur = 14000
    const tick = (n: number) => { const f = Math.min(1, (n - t0) / dur); setT(f); setEu(aoLongo([de, x.pos], f * 0.96)); if (f < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, i])
  const rotaMapa = useMemo(() => x ? ({ sede: SEDE, paradas: r.map((p, k) => ({ pos: p.pos, pri: p.a.pri, feita: k < i, ativa: k === i })) }) : undefined, [r, i, x])
  if (!x) return <div className="pagina"><p className="nota">Sem pontos na rota. <a href="#/rota">Voltar para a rota</a></p></div>
  const resta = distM(eu, x.pos) * 1.25
  const ang = rumo(eu, x.pos)
  const t1 = ts.find(tt => tt.id === x.a.t)!
  const perto = resta < 120

  return (
    <div className="tela-nav">
      <div className="nav-mapa"><Mapa data={DATA_ATUAL} camada="rgb" talhoes={ts} rota={rotaMapa} eu={eu} enquadrar={[de, x.pos]} rotulo="Mapa a caminho do ponto" /></div>
      <section className="nav-painel">
        <a className="voltar" href="#/rota"><Icone n="voltar" c="p" />Rota</a>
        <div className="nav-topo">
          <b className={'num-placa grande ' + x.a.pri}>{i + 1}</b>
          <div><h1>{t1.nome}</h1><p>{x.a.tipo} · ponto {i + 1} de {r.length}</p></div>
        </div>
        <div className="bussola">
          <motion.div className="seta" animate={{ rotate: ang }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}><Icone n="seta-cheia" /></motion.div>
          <div><strong>{resta >= 1000 ? km(resta) : Math.round(resta) + ' m'}</strong><span>rumo {Math.round(ang)}° · {perto ? 'você chegou à área' : 'siga pela estrada interna até a borda do talhão'}</span></div>
        </div>
        <p className={'gps ' + modo}>
          <Icone n="alvo" c="p" />
          {modo === 'gps' ? 'GPS do aparelho ligado' : modo === 'procurando' ? 'Procurando o GPS...' : modo === 'negado' ? 'GPS sem permissão: trajeto simulado' : 'Você está fora da fazenda de exemplo: trajeto simulado'}
          {modo !== 'gps' && modo !== 'procurando' && <span className="prog"><i style={{ width: t * 100 + '%' }} /></span>}
        </p>
        <button className={'bt largo ' + (perto ? 'bt-a' : 'bt-v')} onClick={() => vai('inspecao/' + i)}>Cheguei ao ponto</button>
        <p className="nota">O mapa e a rota ficam salvos no aparelho; a navegação funciona sem internet.</p>
      </section>
    </div>
  )
}

/* ---------------- Inspeção (RF11) ---------------- */
const ACHADOS = ['Praga', 'Doença', 'Falta de água', 'Falha de plantio', 'Erosão', 'Não encontrei nada']

async function comprime(f: File): Promise<string> {
  const url = URL.createObjectURL(f)
  try {
    const im = await new Promise<HTMLImageElement>((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url })
    const k = Math.min(1, 960 / Math.max(im.width, im.height))
    const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k)
    c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.72)
  } finally { URL.revokeObjectURL(url) }
}

export function Inspecao({ i }: { i: number }) {
  const e = useEstado()
  const ts = useTalhoes(e)
  const online = useOnline()
  const r = useRotaOrdenada(e)
  const x = r[Math.min(i, r.length - 1)]
  const [foto, setFoto] = useState<string | undefined>()
  const [achado, setAchado] = useState<string | null>(null)
  const [grav, setGrav] = useState<string | null>(null)
  const [obs, setObs] = useState('')
  const [erro, setErro] = useState('')
  if (!x) return <div className="pagina"><p className="nota">Sem pontos na rota. <a href="#/rota">Voltar</a></p></div>
  const t = ts.find(tt => tt.id === x.a.t)!
  const nada = achado === 'Não encontrei nada'
  const ok = achado && (nada || grav)
  const ultimo = i >= r.length - 1

  const salvar = () => {
    if (!ok) return
    muda(s => ({
      insp: [...s.insp.filter(q => q.alerta !== x.a.id), {
        id: novoId('i'), alerta: x.a.id, talhao: t.id, achado: achado!, grav: nada ? '-' : grav!, obs, confirmada: !nada,
        foto, quando: new Date().toISOString(), st: online ? 'enviada' : 'pendente', por: s.usuario.nome,
      }],
    }))
    aviso(online ? 'Inspeção enviada' : 'Sem sinal: inspeção salva no aparelho')
    vai(ultimo ? 'fila' : 'navegar/' + (i + 1))
  }

  return (
    <div className="pagina estreita inspecao">
      <a className="voltar" href={'#/navegar/' + i}><Icone n="voltar" c="p" />Navegação</a>
      <div className="cab"><div><h1>Inspeção · ponto {i + 1} de {r.length}</h1><p>{t.nome} · {x.a.tipo.toLowerCase()} · <Pri p={x.a.pri} /></p></div></div>
      {!online && <div className="aviso amarelo"><Icone n="sinal" /><div><b>Sem sinal</b><span>A inspeção fica guardada no aparelho e sobe sozinha quando o sinal voltar.</span></div></div>}
      <label className={'foto' + (foto ? ' tem' : '')} style={foto ? { backgroundImage: `url(${foto})` } : undefined}>
        <input type="file" accept="image/*" capture="environment" onChange={async ev => {
          const f = ev.target.files?.[0]; if (!f) return
          try { setFoto(await comprime(f)); setErro('') } catch { setErro('Não consegui ler essa imagem. Tente outra foto.') }
        }} />
        {foto ? <span className="trocar">Trocar foto</span> : <><Icone n="camera" c="g" /><b>Tirar foto do ponto</b><span>Abre a câmera no celular</span></>}
      </label>
      {!foto && <button className="bt bt-t" onClick={() => setFoto(import.meta.env.BASE_URL + FOTO_EXEMPLO)}>Usar foto de exemplo</button>}
      {erro && <p className="erro" role="alert">{erro}</p>}
      <label className="rot" id="achado-rot">O que você encontrou?</label>
      <div className="chips" role="group" aria-labelledby="achado-rot">
        {ACHADOS.map(a => <button key={a} className="chip" aria-pressed={achado === a} onClick={() => { setAchado(a); if (a === 'Não encontrei nada') setGrav(null) }}>{a}</button>)}
      </div>
      {nada && <p className="nota">O ponto vira falso positivo e ajuda a IA a errar menos (UC01, fluxo A4).</p>}
      {achado && !nada && <>
        <label className="rot" id="grav-rot">Gravidade</label>
        <div className="seg claro" role="group" aria-labelledby="grav-rot">
          {['Baixa', 'Média', 'Alta'].map(g => <button key={g} aria-pressed={grav === g} onClick={() => setGrav(g)}>{g}</button>)}
        </div>
      </>}
      <label className="rot" htmlFor="obs">Observação (opcional)</label>
      <textarea id="obs" className="campo" rows={3} value={obs} onChange={ev => setObs(ev.target.value)} placeholder="Ex.: pústulas na face de baixo das folhas" maxLength={400} />
      <button className="bt bt-a largo" disabled={!ok} onClick={salvar}>{ultimo ? 'Salvar e terminar a rota' : 'Salvar e ir ao próximo ponto'}</button>
      {!ok && <p className="nota">{!achado ? 'Escolha o que encontrou para salvar.' : 'Escolha a gravidade para salvar.'}</p>}
    </div>
  )
}

/* ---------------- Fila e resumo do dia (RNF01, RF17) ---------------- */
export function resumoTexto(e: Estado) {
  const linhas = e.insp.map(q => {
    const a = ALERTAS.find(x => x.id === q.alerta)
    return `- ${q.talhao.replace('T', 'Talhão ')}: ${a?.tipo.toLowerCase()} -> ${q.achado}${q.grav !== '-' ? ' (gravidade ' + q.grav.toLowerCase() + ')' : ''}${q.obs ? '. ' + q.obs : ''}`
  })
  return `Resumo do dia 26/12 · ${e.fazenda.nome}\n${e.insp.length} ponto(s) inspecionado(s):\n${linhas.join('\n') || '- nenhum ainda'}\nEnviado pelo AGROAI.`
}

export function Fila() {
  const e = useEstado()
  const online = useOnline()
  const [prog, setProg] = useState(0)
  const enviando = useRef(false)
  const pend = e.insp.filter(q => q.st === 'pendente')
  const rc = retornoCampo(e)
  const agro = e.membros.find(m => m.perfil === 'agronomo' && m.resumo)

  const enviar = () => {
    if (enviando.current || !pend.length) return
    enviando.current = true; setProg(4)
    const tm = setInterval(() => setProg(p => {
      if (p >= 100) { clearInterval(tm); enviando.current = false; muda(s => ({ insp: s.insp.map(q => ({ ...q, st: 'enviada' })) })); aviso('Inspeções enviadas'); return 0 }
      return Math.min(100, p + 16)
    }), 220)
  }
  // RNF01: quando o sinal volta, a fila sobe sozinha
  useEffect(() => { if (online && pend.length) { const t = setTimeout(enviar, 900); return () => clearTimeout(t) } })

  const compartilhar = async () => {
    const txt = resumoTexto(e)
    if (navigator.share) { try { await navigator.share({ title: 'Resumo do dia', text: txt }); return } catch { /* cancelado */ } }
    try { await navigator.clipboard.writeText(txt); aviso('Resumo copiado') } catch { aviso('Não consegui copiar o resumo') }
  }

  return (
    <div className="pagina estreita fila">
      <a className="voltar" href="#/rota"><Icone n="voltar" c="p" />Rota</a>
      <div className="cab"><div><h1>Inspeções de hoje</h1><p>{e.insp.length} registrada(s) · {pend.length} aguardando sinal</p></div></div>
      <div className={'sinal-linha ' + (online ? 'on' : 'off')}>
        <Icone n="sinal" /><b>{online ? 'Com sinal' : 'Sem sinal'}</b>
        <button className={'tog' + (online ? ' on' : '')} onClick={() => muda(s => ({ semSinal: !s.semSinal }))} aria-label="Simular sinal" aria-pressed={online}><i /></button>
      </div>
      {prog > 0 && <div className="prog grande" role="progressbar" aria-valuenow={prog} aria-valuemin={0} aria-valuemax={100}><i style={{ width: prog + '%' }} /></div>}
      <ul className="fila-lista">
        {e.insp.map(q => {
          const a = ALERTAS.find(x => x.id === q.alerta)
          return (
            <li key={q.id}>
              {q.foto ? <img src={q.foto} alt="" /> : <i className="sem-foto"><Icone n="camera" /></i>}
              <div><b>{q.talhao.replace('T', 'Talhão ')} · {q.achado}</b><span>{new Date(q.quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {a?.tipo.toLowerCase()}{q.grav !== '-' ? ' · gravidade ' + q.grav.toLowerCase() : ''}</span></div>
              <em className={q.st}>{q.st === 'pendente' ? 'Aguardando' : 'Enviada'}</em>
            </li>
          )
        })}
        {!e.insp.length && <li className="nota vazio-linha">Nenhuma inspeção ainda. Inicie a rota de hoje.</li>}
      </ul>
      {pend.length > 0 && online && <button className="bt bt-v largo" onClick={enviar}><Icone n="enviar" c="p" />Enviar {pend.length} agora</button>}
      {pend.length > 0 && !online && <p className="nota">Ligue o sinal acima para ver a fila subir sozinha (até 1 min depois que o sinal volta, RNF01).</p>}
      {e.insp.length > 0 && (
        <section className="painel resumo">
          <h2 className="sec">Resumo do dia</h2>
          <div className="numeros-grandes"><div><strong>{rc.conf}</strong><span>confirmados</span></div><div><strong>{rc.falsos}</strong><span>falsos positivos</span></div><div><strong>{rc.precisaoCampo != null ? Math.round(rc.precisaoCampo * 100) + '%' : '-'}</strong><span>acerto da IA hoje</span></div></div>
          <p className="nota">{agro ? `Vai para ${agro.nome}, agrônoma responsável, no fim do dia (RF17).` : 'Convide um agrônomo em Equipe para receber o resumo.'} As respostas entram na próxima recalibração do modelo (RF12).</p>
          <div className="bts"><button className="bt bt-c" onClick={compartilhar}><Icone n="enviar" c="p" />Compartilhar</button>
            <a className="bt bt-c" target="_blank" rel="noreferrer" href={'https://wa.me/?text=' + encodeURIComponent(resumoTexto(e))}><Icone n="whats" c="p" />WhatsApp</a></div>
        </section>
      )}
    </div>
  )
}
