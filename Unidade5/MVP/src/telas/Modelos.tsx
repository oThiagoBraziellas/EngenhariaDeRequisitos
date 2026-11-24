import { useState } from 'react'
import { motion } from 'motion/react'
import { aviso } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { muda, registra, retornoCampo, useEstado } from '../lib/estado'

export function Modelos() {
  const e = useEstado()
  const rc = retornoCampo(e)
  const [treinando, setTreinando] = useState(0)
  const candidata = e.modelos.find(m => m.st === 'candidata')
  const publicada = e.modelos.find(m => m.st === 'publicada' && m.cultura === 'Soja')!

  // RF12: o retorno do campo puxa a precisão na direção do acerto observado, com peso pelo número de amostras.
  const recalibrar = () => {
    if (!rc.total) return
    setTreinando(1)
    const tm = setInterval(() => setTreinando(t => {
      if (t >= 100) {
        clearInterval(tm)
        const peso = rc.total / (rc.total + 40)
        const precisao = Math.min(0.97, publicada.precisao * (1 - peso) + (rc.precisaoCampo ?? publicada.precisao) * peso + 0.01)
        const n = +publicada.v.slice(1) + 0.1
        muda(x => ({ modelos: [{ v: 'v' + n.toFixed(1), cultura: 'Soja', precisao, recall: Math.min(0.95, publicada.recall + 0.01 + rc.conf * 0.004), amostras: publicada.amostras + rc.total, st: 'candidata', data: new Date().toISOString().slice(0, 10), nota: `Recalibrada com ${rc.total} inspeção(ões) de campo (${rc.conf} confirmadas, ${rc.falsos} falsos positivos)` }, ...x.modelos.filter(m => m.st !== 'candidata')] }))
        registra('recalibrou o modelo de soja com ' + rc.total + ' inspeções')
        aviso('Versão candidata pronta para avaliação')
        return 0
      }
      return t + 10
    }), 160)
  }
  const publicar = () => {
    if (!candidata) return
    muda(x => ({ modelos: x.modelos.map(m => m === candidata ? { ...m, st: 'publicada' } : m.st === 'publicada' && m.cultura === candidata.cultura ? { ...m, st: 'arquivada' } : m) }))
    registra('publicou o modelo ' + candidata.v); aviso('Modelo ' + candidata.v + ' publicado: vale a partir da próxima imagem')
  }
  const descartar = () => { muda(x => ({ modelos: x.modelos.filter(m => m !== candidata) })); aviso('Versão candidata descartada') }

  return (
    <div className="pagina modelos">
      <div className="cab"><div><h1>Modelos de IA</h1><p>Avaliar a precisão, recalibrar com o retorno do campo e publicar versões (RF12, RF18)</p></div></div>
      <div className="numeros-grandes amplo">
        <div><strong>{Math.round(publicada.precisao * 100)}%</strong><span>precisão da {publicada.v} (soja)</span></div>
        <div><strong>{Math.round(publicada.recall * 100)}%</strong><span>das anomalias reais encontradas</span></div>
        <div><strong>{rc.total}</strong><span>inspeções novas de campo</span></div>
        <div><strong>{rc.precisaoCampo != null ? Math.round(rc.precisaoCampo * 100) + '%' : '-'}</strong><span>acerto observado no campo</span></div>
      </div>
      <section className="painel">
        <div className="painel-cab"><h2 className="sec">Recalibração</h2><span className="selo-sim">métricas simuladas</span></div>
        <p className="nota">Cada inspeção confirmada vira exemplo positivo; cada "não encontrei nada" vira falso positivo. {rc.total ? '' : 'Faça a rota do dia e registre inspeções para liberar a recalibração.'}</p>
        {treinando > 0 && <div className="prog grande"><motion.i style={{ width: treinando + '%' }} /></div>}
        <button className="bt bt-v" disabled={!rc.total || treinando > 0} onClick={recalibrar}><Icone n="modelo" c="p" />Recalibrar com {rc.total} inspeção(ões)</button>
      </section>
      {candidata && (
        <section className="painel candidata">
          <h2 className="sec">Versão candidata {candidata.v}</h2>
          <div className="compara">
            <div><span>Precisão</span><b>{Math.round(publicada.precisao * 100)}% <Icone n="seta" c="p" /> {Math.round(candidata.precisao * 100)}%</b></div>
            <div><span>Anomalias encontradas</span><b>{Math.round(publicada.recall * 100)}% <Icone n="seta" c="p" /> {Math.round(candidata.recall * 100)}%</b></div>
            <div><span>Amostras</span><b>{publicada.amostras} <Icone n="seta" c="p" /> {candidata.amostras}</b></div>
          </div>
          <p className="nota">{candidata.nota}</p>
          <div className="bts"><button className="bt bt-c" onClick={descartar}>Descartar</button><button className="bt bt-a" onClick={publicar}>Publicar {candidata.v}</button></div>
        </section>
      )}
      <h2 className="sec">Versões</h2>
      <div className="tabela-rolagem">
        <table className="tabela">
          <thead><tr><th>Versão</th><th>Cultura</th><th>Precisão</th><th>Encontradas</th><th>Amostras</th><th>Data</th><th>Situação</th><th>Observação</th></tr></thead>
          <tbody>
            {e.modelos.map(m => (
              <tr key={m.v + m.cultura}>
                <td><b>{m.v}</b></td><td>{m.cultura}</td><td className="n">{Math.round(m.precisao * 100)}%</td><td className="n">{Math.round(m.recall * 100)}%</td>
                <td className="n">{m.amostras.toLocaleString('pt-BR')}</td><td>{m.data.split('-').reverse().join('/')}</td>
                <td><span className={'situ ' + (m.st === 'publicada' ? 'ok' : m.st === 'candidata' ? 'meio' : 'off')}>{m.st}</span></td><td className="nota">{m.nota}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
