import { GRUPOS } from '../lib/menu'
import { Icone } from '../comp/Icone'
import { NOME_PERFIL, muda, registra, useEstado, type Perfil } from '../lib/estado'

export function Mais() {
  const e = useEstado()
  return (
    <div className="pagina estreita mais">
      <div className="cab"><div><h1>Mais</h1><p>{e.fazenda.nome} · {NOME_PERFIL[e.usuario.perfil]}</p></div></div>
      {GRUPOS.slice(1).map(g => {
        const itens = g.itens.filter(i => !i.ve || i.ve(e)); if (!itens.length) return null
        return <section key={g.nome}><h2 className="sec">{g.nome}</h2><ul className="menu-lista">{itens.map(i => <li key={i.id}><a href={'#/' + i.id}><Icone n={i.ic} />{i.nome}<Icone n="seta" c="p" /></a></li>)}</ul></section>
      })}
      <h2 className="sec">Ver como</h2>
      <div className="seg claro" role="group" aria-label="Perfil">
        {(Object.keys(NOME_PERFIL) as Perfil[]).map(p => <button key={p} aria-pressed={e.usuario.perfil === p} onClick={() => { muda(x => ({ usuario: { ...x.usuario, perfil: p } })); registra('entrou como ' + NOME_PERFIL[p].toLowerCase()) }}>{NOME_PERFIL[p]}</button>)}
      </div>
      <ul className="menu-lista"><li><a href="#/perfil"><Icone n="perfil" />Perfil e configurações<Icone n="seta" c="p" /></a></li></ul>
    </div>
  )
}
