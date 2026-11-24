import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icone } from '../comp/Icone'
import { INICIAL, NOME_PERFIL, muda, registra, type Perfil } from '../lib/estado'
import { vai } from '../lib/rotas'

const B = import.meta.env.BASE_URL
const CULT = ['Soja', 'Milho', 'Algodão', 'Feijão', 'Sorgo']
const ANEIS = [300, 372, 452, 542, 644, 758, 884, 1000]
/** Contas de demonstração. shortcut: senha conferida no navegador; na versão com servidor vai para a API com hash (Argon2) e limite por IP. */
const CONTAS: Record<string, { nome: string; perfil: Perfil }> = {
  'produtor@agroai.app': { nome: 'Thiago', perfil: 'produtor' },
  'agronomo@agroai.app': { nome: 'Carla Menezes', perfil: 'agronomo' },
  'admin@agroai.app': { nome: 'Administrador', perfil: 'admin' },
}
const SENHA_DEMO = 'agroai2025'
const MAX_TENTATIVAS = 5
const BLOQUEIO_S = 30

type Modo = 'entrar' | 'sms' | 'codigo' | 'esqueci' | 'enviado' | 'criar' | 'fazenda'
const soDigitos = (s: string) => s.replace(/\D/g, '')
const ehEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
const ehCel = (s: string) => soDigitos(s).length >= 10 && soDigitos(s).length <= 11

export function Entrar() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [id, setId] = useState('')
  const [senha, setSenha] = useState('')
  const [ver, setVer] = useState(false)
  const [manter, setManter] = useState(true)
  const [cod, setCod] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [falhas, setFalhas] = useState(0)
  const [bloqueio, setBloqueio] = useState(0)
  const [termos, setTermos] = useState(false)
  const [lgpd, setLgpd] = useState(false)
  // cadastro
  const [nome, setNome] = useState('')
  const [cel, setCel] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('produtor')
  const [fz, setFz] = useState(INICIAL.fazenda.nome)
  const [mun, setMun] = useState(INICIAL.fazenda.mun)
  const [cult, setCult] = useState<string[]>(['Soja', 'Milho'])
  // quem está entrando depois do código
  const pendente = useRef<{ nome: string; contato: string; perfil: Perfil; novo?: boolean } | null>(null)
  const pivo = useRef<HTMLDivElement>(null)
  const primeiro = useRef<HTMLInputElement>(null)

  // parallax leve dos anéis, como o portal do componente de referência
  useEffect(() => {
    const el = pivo.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let f = 0, px = 0, py = 0, tx = 0, ty = 0
    const move = (ev: PointerEvent) => { tx = ev.clientX / innerWidth * 2 - 1; ty = ev.clientY / innerHeight * 2 - 1 }
    const anima = () => {
      px += (tx - px) * 0.05; py += (ty - py) * 0.05
      el.style.setProperty('--tx', `${px * -14}px`); el.style.setProperty('--ty', `${py * -10}px`)
      f = requestAnimationFrame(anima)
    }
    addEventListener('pointermove', move); f = requestAnimationFrame(anima)
    return () => { removeEventListener('pointermove', move); cancelAnimationFrame(f) }
  }, [])

  useEffect(() => { if (!bloqueio) return; const t = setTimeout(() => setBloqueio(b => b - 1), 1000); return () => clearTimeout(t) }, [bloqueio])
  useEffect(() => { setErro(''); setTimeout(() => primeiro.current?.focus(), 60) }, [modo])

  const espera = () => new Promise(r => setTimeout(r, 650))
  const finaliza = (u: { nome: string; contato: string; perfil: Perfil }, fazenda = INICIAL.fazenda) => {
    muda(() => ({ entrou: true, usuario: u, fazenda }))
    registra('entrou como ' + NOME_PERFIL[u.perfil].toLowerCase() + (manter ? '' : ' (sessão só nesta aba)'))
    vai('hoje')
  }

  const entrar = async () => {
    if (bloqueio) return
    if (!id.trim()) return setErro('Informe seu e-mail ou celular.')
    if (!senha) return setErro('Informe sua senha.')
    setOcupado(true); await espera(); setOcupado(false)
    const conta = CONTAS[id.trim().toLowerCase()]
    if (!conta || senha !== SENHA_DEMO) {
      const n = falhas + 1
      setFalhas(n)
      registra('tentativa de entrada recusada para ' + id.trim(), false)
      if (n >= MAX_TENTATIVAS) { setFalhas(0); setBloqueio(BLOQUEIO_S); return setErro(`Muitas tentativas. Aguarde ${BLOQUEIO_S} segundos para tentar de novo.`) }
      // mensagem genérica: não diz se o e-mail existe (evita descobrir contas)
      return setErro(`E-mail/celular ou senha não conferem. ${MAX_TENTATIVAS - n} tentativa(s) antes de bloquear por ${BLOQUEIO_S} s.`)
    }
    setFalhas(0)
    pendente.current = { nome: conta.nome, contato: id.trim().toLowerCase(), perfil: conta.perfil }
    if (conta.perfil === 'admin') { setCod(''); setModo('codigo') } // administrador exige o segundo fator
    else finaliza(pendente.current)
  }

  const pedirSms = async () => {
    if (!ehCel(cel)) return setErro('Informe o celular com DDD, só números ou no formato (64) 99999-0000.')
    setOcupado(true); await espera(); setOcupado(false)
    pendente.current = { nome: 'Produtor', contato: cel, perfil: 'produtor' }
    setCod(''); setModo('codigo')
  }

  const conferir = async () => {
    if (soDigitos(cod).length !== 6) return setErro('Digite os 6 números do código.')
    setOcupado(true); await espera(); setOcupado(false)
    const p = pendente.current
    if (!p) return setModo('entrar')
    if (p.novo && p.perfil === 'produtor') return setModo('fazenda')
    finaliza(p)
  }

  const recuperar = async () => {
    if (!ehEmail(id) && !ehCel(id)) return setErro('Informe o e-mail ou o celular da conta.')
    setOcupado(true); await espera(); setOcupado(false)
    registra('pediu nova senha para ' + id.trim()); setModo('enviado')
  }

  const criar = async () => {
    if (!nome.trim()) return setErro('Informe seu nome.')
    if (!ehCel(cel)) return setErro('Informe o celular com DDD.')
    if (senha.length < 8) return setErro('A senha precisa de pelo menos 8 caracteres.')
    if (!termos) return setErro('Para criar a conta, aceite os termos de uso e a política de privacidade.')
    setOcupado(true); await espera(); setOcupado(false)
    pendente.current = { nome: nome.trim(), contato: cel, perfil, novo: true }
    setCod(''); setModo('codigo')
  }

  const criarFazenda = () => {
    if (!fz.trim() || !cult.length) return setErro('Informe o nome da fazenda e pelo menos uma cultura.')
    const p = pendente.current!
    finaliza({ nome: p.nome, contato: p.contato, perfil: p.perfil }, { nome: fz.trim(), mun: mun.trim() || INICIAL.fazenda.mun, cult })
  }

  const envia = (ev: FormEvent) => {
    ev.preventDefault()
    if (ocupado) return
    ;({ entrar, sms: pedirSms, codigo: conferir, esqueci: recuperar, criar, fazenda: criarFazenda, enviado: () => setModo('entrar') } as Record<Modo, () => void>)[modo]()
  }
  const demo = () => { muda(() => ({ entrou: true })); registra('entrou na demonstração'); vai('hoje') }

  const TITULO: Record<Modo, [string, string]> = {
    entrar: ['Bem-vindo de volta.', 'Veja quais talhões precisam de você hoje.'],
    sms: ['Entrar sem senha.', 'Mandamos um código de 6 números para o seu celular.'],
    codigo: [pendente.current?.perfil === 'admin' && !pendente.current?.novo ? 'Confirme que é você.' : 'Digite o código.', pendente.current?.perfil === 'admin' && !pendente.current?.novo ? 'Contas de administrador pedem um segundo passo: o código enviado ao celular cadastrado.' : `Enviamos 6 números para ${pendente.current?.contato || 'seu celular'}.`],
    esqueci: ['Esqueceu a senha?', 'Informe o e-mail ou celular da conta e mandamos um link para criar outra.'],
    enviado: ['Confira seu e-mail ou SMS.', `Se existir uma conta com ${id.trim() || 'esse contato'}, o link chega em instantes e vale por 30 minutos.`],
    criar: ['Crie sua conta.', 'Leva um minuto. Os talhões da fazenda de exemplo já vêm desenhados.'],
    fazenda: ['Sua fazenda.', 'Último passo: o nome e o que você planta nesta safra.'],
  }
  const BOTAO: Record<Modo, string> = { entrar: 'Entrar', sms: 'Receber código', codigo: 'Confirmar', esqueci: 'Enviar link', enviado: 'Voltar para entrar', criar: 'Criar conta', fazenda: 'Criar fazenda e entrar' }
  const voltar = modo !== 'entrar' && modo !== 'enviado'

  return (
    <div className="ent" ref={pivo}>
      <svg className="ent-aneis" viewBox="0 0 2000 2000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {ANEIS.map((r, i) => {
          const l = 9 + (i % 3) * 5
          return (
            <g key={r}>
              <circle className="ent-base" cx="1000" cy="1000" r={r} />
              <circle className={'ent-arco' + (i % 2 ? ' inv' : '')} cx="1000" cy="1000" r={r} pathLength={100}
                strokeDasharray={`${l} ${100 - l}`} style={{ animationDuration: `${38 + i * 12}s`, animationDelay: `${-i * 7.3}s` }} />
            </g>
          )
        })}
      </svg>

      <header className="ent-topo">
        {modo === 'criar' || modo === 'fazenda'
          ? <div className="ent-junta"><span>Já tem conta?</span><button type="button" onClick={() => setModo('entrar')}>Entrar<Icone n="seta" c="p" /></button></div>
          : <div className="ent-junta"><span>Novo no AGROAI?</span><button type="button" onClick={() => setModo('criar')}>Criar conta<Icone n="seta" c="p" /></button></div>}
      </header>

        <main className="ent-col">
          <AnimatePresence mode="wait" initial={true}>
            <motion.div key={modo} className="ent-passo"
              initial="fora" animate="dentro" exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
              variants={{ dentro: { transition: { staggerChildren: 0.045 } } }}>
              {voltar && <Sobe><button type="button" className="ent-voltar" onClick={() => setModo(modo === 'fazenda' ? 'criar' : 'entrar')}><Icone n="voltar" c="p" />Voltar</button></Sobe>}
              {!voltar && <Sobe><img className="ent-marca" src={B + 'logo_branca.png'} alt="AGROAI" /></Sobe>}
              <Sobe><h1>{TITULO[modo][0]}</h1></Sobe>
              <Sobe><p className="ent-sub">{TITULO[modo][1]}</p></Sobe>

              <form onSubmit={envia} noValidate aria-busy={ocupado}>
                {modo === 'entrar' && <>
                  <Campo id="e-id" rot="E-mail ou celular" ic="perfil">
                    <input ref={primeiro} id="e-id" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
                      value={id} onChange={ev => setId(ev.target.value)} placeholder="voce@fazenda.com.br" maxLength={80} aria-invalid={!!erro && !id.trim()} />
                  </Campo>
                  <Senha valor={senha} muda={setSenha} ver={ver} setVer={setVer} auto="current-password" />
                  <Sobe><div className="ent-linha">
                    <label className="ent-check"><input type="checkbox" checked={manter} onChange={ev => setManter(ev.target.checked)} /><i />Manter conectado neste aparelho</label>
                    <button type="button" className="ent-link" onClick={() => setModo('esqueci')}>Esqueci a senha</button>
                  </div></Sobe>
                </>}

                {modo === 'sms' && <Campo id="e-cel" rot="Celular" ic="celular">
                  <input ref={primeiro} id="e-cel" type="tel" inputMode="tel" autoComplete="tel" value={cel} onChange={ev => setCel(ev.target.value)} placeholder="(64) 99999-0000" maxLength={20} />
                </Campo>}

                {modo === 'codigo' && <>
                  <Campo id="e-cod" rot="Código de 6 números" ic="cadeado">
                    <input ref={primeiro} id="e-cod" className="ent-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*"
                      value={cod} onChange={ev => setCod(soDigitos(ev.target.value).slice(0, 6))} placeholder="000000" />
                  </Campo>
                  <Sobe><p className="ent-dica">Demonstração sem servidor de SMS: qualquer sequência de 6 números confirma. <Reenviar /></p></Sobe>
                </>}

                {modo === 'esqueci' && <Campo id="e-rec" rot="E-mail ou celular" ic="perfil">
                  <input ref={primeiro} id="e-rec" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" value={id} onChange={ev => setId(ev.target.value)} maxLength={80} />
                </Campo>}

                {modo === 'criar' && <>
                  <Campo id="e-nome" rot="Seu nome" ic="perfil">
                    <input ref={primeiro} id="e-nome" autoComplete="name" value={nome} onChange={ev => setNome(ev.target.value)} maxLength={60} />
                  </Campo>
                  <Campo id="e-cel2" rot="Celular" ic="celular">
                    <input id="e-cel2" type="tel" inputMode="tel" autoComplete="tel" value={cel} onChange={ev => setCel(ev.target.value)} placeholder="(64) 99999-0000" maxLength={20} />
                  </Campo>
                  <Senha valor={senha} muda={setSenha} ver={ver} setVer={setVer} auto="new-password" nova />
                  <Sobe><span className="ent-rot" id="e-pf">Você é</span>
                    <div className="seg claro" role="group" aria-labelledby="e-pf">
                      {(Object.keys(NOME_PERFIL) as Perfil[]).map(p => <button type="button" key={p} aria-pressed={perfil === p} onClick={() => setPerfil(p)}>{NOME_PERFIL[p]}</button>)}
                    </div></Sobe>
                  <Sobe><label className="ent-check topo"><input type="checkbox" checked={termos} onChange={ev => setTermos(ev.target.checked)} /><i />
                    <span>Li e aceito os <button type="button" className="ent-link" onClick={() => setLgpd(true)}>termos de uso e a política de privacidade</button>.</span></label></Sobe>
                </>}

                {modo === 'fazenda' && <>
                  <Campo id="e-fz" rot="Nome da fazenda" ic="mapa">
                    <input ref={primeiro} id="e-fz" value={fz} onChange={ev => setFz(ev.target.value)} maxLength={60} />
                  </Campo>
                  <Campo id="e-mun" rot="Município" ic="bussola">
                    <input id="e-mun" value={mun} onChange={ev => setMun(ev.target.value)} maxLength={60} />
                  </Campo>
                  <Sobe><span className="ent-rot" id="e-ct">O que você planta nesta safra?</span>
                    <div className="chips" role="group" aria-labelledby="e-ct">
                      {CULT.map(c => <button type="button" key={c} className="chip" aria-pressed={cult.includes(c)} onClick={() => setCult(cult.includes(c) ? cult.filter(x => x !== c) : [...cult, c])}>{c}</button>)}
                    </div></Sobe>
                </>}

                <div className="ent-erro" role="alert" aria-live="assertive">{erro && <><Icone n="alertas" c="p" />{erro}</>}</div>

                <Sobe><button className="bt bt-a largo ent-acao" disabled={ocupado || bloqueio > 0}>
                  {ocupado ? <><span className="ent-gira" aria-hidden="true" />Aguarde</> : bloqueio ? `Tente em ${bloqueio} s` : <>{BOTAO[modo]}<Icone n="seta" c="p" /></>}
                </button></Sobe>
              </form>

              {modo === 'entrar' && <>
                <Sobe><div className="ent-ou"><i />ou<i /></div></Sobe>
                <Sobe><button type="button" className="ent-soc" onClick={() => setModo('sms')}><Icone n="celular" c="p" />Entrar com código por SMS</button></Sobe>
                <Sobe><details className="ent-demo">
                  <summary>Contas de demonstração</summary>
                  <p>Senha <code>{SENHA_DEMO}</code> para <code>produtor@agroai.app</code>, <code>agronomo@agroai.app</code> ou <code>admin@agroai.app</code> (este pede o código de 6 números).</p>
                  <button type="button" className="bt bt-t" onClick={demo}>Ou entre direto na fazenda de exemplo</button>
                </details></Sobe>
              </>}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="ent-pe">
          <span>Saiba onde ir antes de sair para o campo.</span>
          <nav><button type="button" onClick={() => setLgpd(true)}>Termos</button><button type="button" onClick={() => setLgpd(true)}>Privacidade</button></nav>
        </footer>

      {lgpd && <Privacidade fecha={() => setLgpd(false)} />}
    </div>
  )
}

const sobe = { fora: { opacity: 0, y: 12 }, dentro: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const } } }
function Sobe({ children }: { children: ReactNode }) { return <motion.div variants={sobe}>{children}</motion.div> }

function Campo({ id, rot, ic, children, fim }: { id: string; rot: string; ic: string; children: ReactNode; fim?: ReactNode }) {
  return (
    <Sobe>
      <label className="ent-rot" htmlFor={id}>{rot}</label>
      <div className="ent-campo"><Icone n={ic} c="p" />{children}{fim}</div>
    </Sobe>
  )
}

function Senha({ valor, muda, ver, setVer, auto, nova }: { valor: string; muda: (s: string) => void; ver: boolean; setVer: (b: boolean) => void; auto: string; nova?: boolean }) {
  const [caps, setCaps] = useState(false)
  return (
    <>
      <Campo id="e-senha" rot="Senha" ic="cadeado" fim={
        <button type="button" className="ent-olho" onClick={() => setVer(!ver)} aria-label={ver ? 'Esconder senha' : 'Mostrar senha'} aria-pressed={ver}><Icone n={ver ? 'olhoX' : 'olho'} c="p" /></button>}>
        <input id="e-senha" type={ver ? 'text' : 'password'} autoComplete={auto} value={valor} onChange={ev => muda(ev.target.value)} maxLength={128}
          onKeyUp={ev => setCaps(ev.getModifierState('CapsLock'))} aria-describedby={nova ? 'e-senha-req' : undefined} />
      </Campo>
      {caps && <p className="ent-dica aviso-caps">Caps Lock ligado.</p>}
      {nova && <p className={'ent-dica' + (valor.length >= 8 ? ' ok' : '')} id="e-senha-req">{valor.length >= 8 ? <Icone n="check" c="p" /> : null}Pelo menos 8 caracteres. Uma frase fácil de lembrar vale mais que símbolos.</p>}
    </>
  )
}

function Reenviar() {
  const [s, setS] = useState(30)
  useEffect(() => { if (!s) return; const t = setTimeout(() => setS(s - 1), 1000); return () => clearTimeout(t) }, [s])
  return s ? <span>Reenviar em {s} s.</span> : <button type="button" className="ent-link" onClick={() => setS(30)}>Reenviar código</button>
}

function Privacidade({ fecha }: { fecha: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return (
    <dialog ref={ref} className="ent-dialogo" onClose={fecha} aria-labelledby="lgpd-t">
      <h2 id="lgpd-t">Termos e privacidade</h2>
      <ul>
        <li>Usamos seu nome, celular e e-mail só para entrar no app e mandar os alertas da fazenda.</li>
        <li>Contornos, inspeções e fotos dos talhões são seus. Só quem você convidar enxerga.</li>
        <li>Imagens de satélite vêm do Copernicus Sentinel-2, que é público.</li>
        <li>Você pode baixar ou apagar seus dados a qualquer momento em Perfil.</li>
        <li>Na versão com servidor, os dados ficam em servidor no Brasil, com acesso registrado.</li>
      </ul>
      <p className="nota">Texto de demonstração do trabalho acadêmico; não substitui termos revisados por advogado.</p>
      <form method="dialog"><button className="bt bt-a largo">Entendi</button></form>
    </dialog>
  )
}
