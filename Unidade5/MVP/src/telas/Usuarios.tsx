import { useState } from 'react'
import { NOME_PERFIL, useEstado, useTalhoes } from '../lib/estado'
import { num } from '../lib/dados'

export function Usuarios() {
  const e = useEstado()
  const ts = useTalhoes(e)
  const [so, setSo] = useState<'todos' | 'negados'>('todos')
  const regs = e.registros.filter(r => so === 'todos' || !r.ok)
  const usuarios = [{ nome: e.usuario.nome, contato: e.usuario.contato, perfil: 'produtor' as const, st: 'ativo', fazendas: 1 }, ...e.membros.map(m => ({ ...m, fazendas: 1 }))]

  return (
    <div className="pagina usuarios">
      <div className="cab"><div><h1>Usuários e acesso</h1><p>Gestão da plataforma: contas, fazendas atendidas e histórico de acesso (RF01, RNF04)</p></div></div>
      <div className="numeros-grandes amplo">
        <div><strong>{usuarios.length}</strong><span>contas</span></div>
        <div><strong>1</strong><span>fazenda no piloto</span></div>
        <div><strong>{num(ts.reduce((s, t) => s + t.ha, 0), 0)}</strong><span>ha monitorados</span></div>
        <div><strong>{e.registros.filter(r => !r.ok).length}</strong><span>acessos negados</span></div>
      </div>
      <h2 className="sec">Contas</h2>
      <div className="tabela-rolagem">
        <table className="tabela">
          <thead><tr><th>Nome</th><th>Contato</th><th>Perfil</th><th>Situação</th><th>Fazendas</th></tr></thead>
          <tbody>{usuarios.map(u => <tr key={u.contato}><td><b>{u.nome}</b></td><td>{u.contato}</td><td>{NOME_PERFIL[u.perfil]}</td><td><span className={'situ ' + (u.st === 'ativo' ? 'ok' : 'meio')}>{u.st}</span></td><td className="n">{u.fazendas}</td></tr>)}</tbody>
        </table>
      </div>
      <h2 className="sec">Fazendas</h2>
      <div className="tabela-rolagem">
        <table className="tabela">
          <thead><tr><th>Fazenda</th><th>Município</th><th>Talhões</th><th>Área</th><th>Culturas</th><th>Dados</th></tr></thead>
          <tbody><tr><td><b>{e.fazenda.nome}</b></td><td>{e.fazenda.mun}</td><td className="n">{ts.length}</td><td className="n">{num(ts.reduce((s, t) => s + t.ha, 0), 1)} ha</td><td>{e.fazenda.cult.join(', ')}</td><td>Servidor no Brasil · HTTPS/TLS 1.2+</td></tr></tbody>
        </table>
      </div>
      <div className="painel-cab"><h2 className="sec">Histórico de acesso</h2>
        <div className="chips">{(['todos', 'negados'] as const).map(x => <button key={x} className="chip pq" aria-pressed={so === x} onClick={() => setSo(x)}>{x === 'todos' ? 'Todos' : 'Só negados'}</button>)}</div></div>
      <ul className="registros">
        {regs.map((r, i) => (
          <li key={i} className={r.ok ? '' : 'negado'}>
            <time>{new Date(r.quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time>
            <span><b>{r.quem}</b> {r.acao}</span>
            <em>{r.ok ? 'permitido' : 'negado'}</em>
          </li>
        ))}
      </ul>
    </div>
  )
}
