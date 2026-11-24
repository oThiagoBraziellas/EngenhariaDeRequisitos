import { useState } from 'react'
import { aviso } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { NOME_PERFIL, muda, novoId, registra, useEstado, type Perfil } from '../lib/estado'
import { resumoTexto } from './Campo'

const valido = (c: string) => /^\S+@\S+\.\S+$/.test(c) || c.replace(/\D/g, '').length >= 10

export function Equipe() {
  const e = useEstado()
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('agronomo')
  const [erro, setErro] = useState('')

  const convidar = async () => {
    if (!nome.trim()) { setErro('Informe o nome de quem vai entrar.'); return }
    if (!valido(contato)) { setErro('Informe um e-mail ou celular com DDD.'); return }
    if (e.membros.some(m => m.contato === contato.trim())) { setErro('Essa pessoa já está na fazenda.'); return }
    muda(x => ({ membros: [...x.membros, { id: novoId('m'), nome: nome.trim(), contato: contato.trim(), perfil, st: 'convidado', desde: new Date().toISOString().slice(0, 10), resumo: perfil === 'agronomo' }] }))
    registra('convidou ' + nome.trim() + ' como ' + NOME_PERFIL[perfil].toLowerCase())
    const link = location.href.split('#')[0] + '#/hoje'
    const txt = `${e.usuario.nome} convidou você para acompanhar a ${e.fazenda.nome} no AGROAI: ${link}`
    try { if (navigator.share) await navigator.share({ title: 'Convite AGROAI', text: txt }); else { await navigator.clipboard.writeText(txt); aviso('Convite criado e link copiado') } } catch { aviso('Convite criado') }
    setNome(''); setContato(''); setErro('')
  }
  const remover = (id: string, n: string) => { muda(x => ({ membros: x.membros.filter(m => m.id !== id) })); registra('removeu o acesso de ' + n); aviso('Acesso de ' + n + ' removido') }
  const alternaResumo = (id: string) => muda(x => ({ membros: x.membros.map(m => m.id === id ? { ...m, resumo: !m.resumo } : m) }))
  const ativa = (id: string) => muda(x => ({ membros: x.membros.map(m => m.id === id ? { ...m, st: 'ativo' } : m) }))

  return (
    <div className="pagina equipe">
      <div className="cab"><div><h1>Equipe e convites</h1><p>Só você e quem você autorizar veem a {e.fazenda.nome} (RF16, RNF04)</p></div></div>
      <div className="duas">
        <section>
          <h2 className="sec">Quem tem acesso</h2>
          <ul className="membros">
            <li><b className="avatar grande">{e.usuario.nome[0]}</b><div><b>{e.usuario.nome} (você)</b><span>{e.usuario.contato} · dono da fazenda</span></div></li>
            {e.membros.map(m => (
              <li key={m.id}>
                <b className="avatar grande">{m.nome[0]}</b>
                <div><b>{m.nome}</b><span>{m.contato} · {NOME_PERFIL[m.perfil]} · {m.st === 'convidado' ? 'convite enviado' : 'desde ' + m.desde.split('-').reverse().join('/')}</span>
                  {m.perfil === 'agronomo' && <label className="check"><input type="checkbox" checked={m.resumo} onChange={() => alternaResumo(m.id)} />Recebe o resumo do dia (RF17)</label>}
                </div>
                <div className="acoes-linha">
                  {m.st === 'convidado' && <button className="bt bt-c" onClick={() => ativa(m.id)}>Marcar como aceito</button>}
                  <button className="bt bt-t" onClick={() => remover(m.id, m.nome)} aria-label={'Remover ' + m.nome}><Icone n="lixo" c="p" />Remover</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="painel">
          <h2 className="sec">Convidar</h2>
          <label className="rot" htmlFor="c-nome">Nome</label>
          <input id="c-nome" className="campo" value={nome} onChange={ev => setNome(ev.target.value)} placeholder="Ex.: Dra. Paula, agrônoma" maxLength={60} />
          <label className="rot" htmlFor="c-ct">E-mail ou celular</label>
          <input id="c-ct" className="campo" value={contato} onChange={ev => setContato(ev.target.value)} placeholder="nome@exemplo.com ou (64) 9..." inputMode="email" maxLength={80} />
          <label className="rot" id="c-pf">Perfil</label>
          <div className="chips" role="group" aria-labelledby="c-pf">
            {(['agronomo', 'produtor'] as Perfil[]).map(p => <button key={p} className="chip" aria-pressed={perfil === p} onClick={() => setPerfil(p)}>{p === 'produtor' ? 'Encarregado de campo' : NOME_PERFIL[p]}</button>)}
          </div>
          <p className="nota">{perfil === 'agronomo' ? 'O agrônomo vê talhões, alertas, inspeções e relatórios e recebe o resumo do dia. Não altera talhões.' : 'O encarregado faz a rota e registra inspeções.'}</p>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="bt bt-a largo" onClick={convidar}><Icone n="enviar" c="p" />Enviar convite</button>
          <h2 className="sec">Prévia do resumo do dia</h2>
          <pre className="resumo-txt">{resumoTexto(e)}</pre>
        </section>
      </div>
    </div>
  )
}
