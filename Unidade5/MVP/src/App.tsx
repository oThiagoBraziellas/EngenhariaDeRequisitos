import { AnimatePresence, motion } from 'motion/react'
import { Icone } from './comp/Icone'
import { Toast, useToast } from './comp/Pecas'
import { NOME_PERFIL, alertasAtivos, muda, pode, registra, useEstado, useOnline, type Perfil } from './lib/estado'
import { useRota, vai } from './lib/rotas'
import { Hoje } from './telas/Hoje'
import { MapaTela } from './telas/MapaTela'
import { TalhaoTela } from './telas/TalhaoTela'
import { AlertasTela } from './telas/AlertasTela'
import { RotaTela, Navegar, Inspecao, Fila } from './telas/Campo'
import { Desenhar } from './telas/Desenhar'
import { Perfil as PerfilTela } from './telas/Perfil'
import { Talhoes } from './telas/Talhoes'
import { Imagens } from './telas/Imagens'
import { Relatorios } from './telas/Relatorios'
import { Assistente } from './telas/Assistente'
import { Equipe } from './telas/Equipe'
import { Modelos } from './telas/Modelos'
import { Usuarios } from './telas/Usuarios'
import { Mais } from './telas/Mais'
import { GRUPOS } from './lib/menu'

const SECAO: Record<string, string> = { talhao: 'talhoes', desenhar: 'talhoes', navegar: 'rota', inspecao: 'rota', fila: 'rota' }
const CHEIO = new Set(['mapa', 'desenhar', 'navegar'])
const ABAS_CEL = ['hoje', 'mapa', 'rota', 'alertas']
const RESTRITO: Record<string, 'equipe' | 'modelos' | 'gestao'> = { equipe: 'equipe', modelos: 'modelos', usuarios: 'gestao' }

export default function App() {
  const e = useEstado()
  const online = useOnline()
  const msg = useToast()
  const [tela = 'hoje', arg] = useRota()

  const sec = SECAO[tela] || tela
  const nAl = alertasAtivos(e).filter(a => a.pri !== 'baixa').length
  const pend = e.insp.filter(i => i.st === 'pendente').length
  const negado = RESTRITO[tela] && !pode(e, RESTRITO[tela])
  const conteudo = negado ? <Negado tela={tela} /> : (() => {
    switch (tela) {
      case 'mapa': return <MapaTela sel={arg} />
      case 'talhao': return <TalhaoTela id={arg || 'T1'} />
      case 'alertas': return <AlertasTela id={arg} />
      case 'rota': return <RotaTela />
      case 'navegar': return <Navegar i={+(arg || 0)} />
      case 'inspecao': return <Inspecao i={+(arg || 0)} />
      case 'fila': return <Fila />
      case 'desenhar': return <Desenhar />
      case 'perfil': return <PerfilTela />
      case 'talhoes': return <Talhoes />
      case 'imagens': return <Imagens />
      case 'relatorios': return <Relatorios id={arg} />
      case 'assistente': return <Assistente />
      case 'equipe': return <Equipe />
      case 'modelos': return <Modelos />
      case 'usuarios': return <Usuarios />
      case 'mais': return <Mais />
      default: return <Hoje />
    }
  })()
  const trocaPerfil = (p: Perfil) => { muda(x => ({ usuario: { ...x.usuario, perfil: p } })); registra('entrou como ' + NOME_PERFIL[p].toLowerCase()) }

  return (
    <div className="casca">
      <header className="barra">
        <a className="marca" href="#/hoje"><img src={import.meta.env.BASE_URL + 'logo_branca.png'} alt="AGROAI, início" /></a>
        <div className="barra-dir">
          <button className={'sinal' + (online ? '' : ' off')} onClick={() => muda(x => ({ semSinal: !x.semSinal }))} aria-pressed={!online} title="Simular a falta de sinal no campo">
            <i />{online ? 'Com sinal' : 'Sem sinal'}{pend > 0 && <span className="conta">{pend}</span>}
          </button>
          <a className="avatar" href="#/perfil" aria-label="Perfil e configurações">{e.usuario.nome.slice(0, 1)}</a>
        </div>
      </header>
      <nav className="lateral" aria-label="Seções">
        <div className="fz"><b>{e.fazenda.nome}</b><span>{e.fazenda.mun} · safra 2025/26</span></div>
        {GRUPOS.map(g => {
          const itens = g.itens.filter(i => !i.ve || i.ve(e))
          if (!itens.length) return null
          return (
            <div className="grupo" key={g.nome}>
              <h2>{g.nome}</h2>
              {itens.map(i => (
                <a key={i.id} href={'#/' + i.id} aria-current={sec === i.id ? 'page' : undefined}>
                  <Icone n={i.ic} />{i.nome}{i.id === 'alertas' && nAl > 0 && <span className="conta">{nAl}</span>}
                </a>
              ))}
            </div>
          )
        })}
        <div className="quem">
          <span className="rot-quem" id="perfil-rot">Ver como</span>
          <div className="seg seg-quem" role="group" aria-labelledby="perfil-rot">
            {(Object.keys(NOME_PERFIL) as Perfil[]).map(p => <button key={p} aria-pressed={e.usuario.perfil === p} onClick={() => trocaPerfil(p)}>{p === 'admin' ? 'Admin' : NOME_PERFIL[p]}</button>)}
          </div>
          <a href="#/perfil" aria-current={sec === 'perfil' ? 'page' : undefined}><Icone n="perfil" />{e.usuario.nome} · configurações</a>
        </div>
      </nav>
      <nav className="abas-cel" aria-label="Seções principais">
        {ABAS_CEL.map(id => {
          const i = GRUPOS[0].itens.find(x => x.id === id)!
          return <a key={id} href={'#/' + id} aria-current={sec === id ? 'page' : undefined}><Icone n={i.ic} />{id === 'rota' ? 'Rota' : i.nome}{id === 'alertas' && nAl > 0 && <span className="conta">{nAl}</span>}</a>
        })}
        <a href="#/mais" aria-current={!ABAS_CEL.includes(sec) ? 'page' : undefined}><Icone n="menu" />Mais</a>
      </nav>
      <main className={'palco' + (CHEIO.has(tela) ? ' cheio' : '')} id="conteudo">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tela + (arg || '')} className="tela"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}>
            {conteudo}
          </motion.div>
        </AnimatePresence>
      </main>
      <Toast msg={msg} />
    </div>
  )
}

function Negado({ tela }: { tela: string }) {
  return (
    <div className="pagina estreita">
      <div className="painel vazio">
        <Icone n="cadeado" c="g" />
        <h1>Esta área é do administrador</h1>
        <p className="nota">Seu perfil não tem acesso a "{tela}". A tentativa ficou registrada no histórico de acesso, como pede a proteção de dados da fazenda.</p>
        <button className="bt bt-v" onClick={() => { registra('tentou abrir ' + tela + ' sem permissão', false); vai('hoje') }}>Voltar para o início</button>
      </div>
    </div>
  )
}
