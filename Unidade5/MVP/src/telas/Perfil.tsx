import { aviso } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { NOME_PERFIL, muda, registra, useEstado, zera } from '../lib/estado'
import { vai } from '../lib/rotas'

const HORAS = ['05:00', '05:30', '06:00', '06:30', '07:00']

export function Perfil() {
  const e = useEstado()
  const n = e.notif
  const setN = (p: Partial<typeof n>) => muda(x => ({ notif: { ...x.notif, ...p } }))

  const ligaPush = async () => {
    if (n.push) { setN({ push: false }); return }
    if (!('Notification' in window)) { aviso('Este navegador não mostra notificações'); return }
    const r = await Notification.requestPermission()
    if (r === 'granted') {
      setN({ push: true })
      new Notification('AGROAI', { body: 'Pronto: você recebe aqui os alertas graves da fazenda.' })
    } else aviso('Permissão negada no navegador')
  }
  const exportar = () => {
    const blob = new Blob([JSON.stringify({ ...e, chat: undefined }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'agroai-dados.json'; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); registra('baixou os dados da fazenda')
  }
  const apagar = () => { zera(); vai('hoje') }
  const sair = () => { registra('saiu'); muda(() => ({ entrou: false })); vai('hoje') }

  return (
    <div className="pagina estreita perfil">
      <div className="cab"><div><h1>{e.usuario.nome}</h1><p>{e.usuario.contato} · {NOME_PERFIL[e.usuario.perfil]} · {e.fazenda.nome}</p></div></div>
      <h2 className="sec">Alertas</h2>
      <ul className="cfg">
        <li><div><b>Horário da rota do dia</b><span>A rota chega pronta neste horário</span></div>
          <div className="chips">{HORAS.map(h => <button key={h} className="chip pq" aria-pressed={n.hora === h} onClick={() => setN({ hora: h })}>{h}</button>)}</div></li>
        <li><div><b>Notificação no aparelho</b><span>Alerta push quando surge anomalia grave (RF13)</span></div>
          <button className={'tog' + (n.push ? ' on' : '')} aria-pressed={n.push} aria-label="Notificação no aparelho" onClick={ligaPush}><i /></button></li>
        <li><div><b>WhatsApp</b><span>Alertas pelo WhatsApp (RF19)</span>
          {n.whatsapp && <input className="campo" value={n.whatsNum} onChange={ev => setN({ whatsNum: ev.target.value })} placeholder="(64) 99999-0000" inputMode="tel" aria-label="Número do WhatsApp" />}</div>
          <button className={'tog' + (n.whatsapp ? ' on' : '')} aria-pressed={n.whatsapp} aria-label="WhatsApp" onClick={() => setN({ whatsapp: !n.whatsapp })}><i /></button></li>
        {n.whatsapp && <li className="sub"><span className="nota">Nesta versão o envio abre o WhatsApp com a mensagem pronta.</span>
          <a className="bt bt-c" target="_blank" rel="noreferrer" href={`https://wa.me/${n.whatsNum.replace(/\D/g, '') ? '55' + n.whatsNum.replace(/\D/g, '') : ''}?text=${encodeURIComponent('AGROAI · Alerta: risco de ferrugem-asiática no Talhão 1 da ' + e.fazenda.nome + '. Rota de hoje pronta no app.')}`}><Icone n="whats" c="p" />Testar mensagem</a></li>}
        <li><div><b>Resumo por e-mail</b><span>Resumo do dia para a equipe</span></div>
          <button className={'tog' + (n.email ? ' on' : '')} aria-pressed={n.email} aria-label="Resumo por e-mail" onClick={() => setN({ email: !n.email })}><i /></button></li>
      </ul>
      <h2 className="sec">Campo</h2>
      <ul className="cfg">
        <li><div><b>Mapas para usar sem sinal</b><span>{e.mapasOff ? 'Baixados · 6 cenas · 0,8 MB' : 'Baixa as imagens da fazenda no Wi-Fi'}</span></div>
          <button className={'tog' + (e.mapasOff ? ' on' : '')} aria-pressed={e.mapasOff} aria-label="Mapas para usar sem sinal" onClick={() => muda(x => ({ mapasOff: !x.mapasOff }))}><i /></button></li>
        <li><div><b>Simular campo sem sinal</b><span>{e.semSinal ? 'Sem sinal: inspeções ficam na fila e sobem quando o sinal voltar' : 'Teste o uso offline no campo (RNF)'}</span></div>
          <button className={'tog' + (e.semSinal ? ' on' : '')} aria-pressed={e.semSinal} aria-label="Simular campo sem sinal" onClick={() => muda(x => ({ semSinal: !x.semSinal }))}><i /></button></li>
        <li><div><b>Talhões</b><span>Desenhar, importar do CAR e editar safras</span></div><a className="bt bt-c" href="#/talhoes">Abrir</a></li>
      </ul>
      <h2 className="sec">Seus dados (LGPD)</h2>
      <ul className="cfg">
        <li><div><b>Baixar meus dados</b><span>Fazenda, talhões, inspeções e histórico em JSON</span></div><button className="bt bt-c" onClick={exportar}><Icone n="baixar" c="p" />Baixar</button></li>
        <li><div><b>Apagar tudo deste aparelho</b><span>Volta a fazenda de exemplo ao estado inicial</span></div><button className="bt bt-t" onClick={apagar}><Icone n="lixo" c="p" />Apagar dados</button></li>
      </ul>
      <button className="bt bt-c largo sair" onClick={sair}><Icone n="voltar" c="p" />Sair</button>
      <p className="nota">Nesta versão os dados ficam só neste navegador. Na versão com servidor, ficam em servidor no Brasil com acesso só para quem você autorizar.</p>
    </div>
  )
}
