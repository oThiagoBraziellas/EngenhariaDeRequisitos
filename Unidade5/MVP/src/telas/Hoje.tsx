import { useMemo } from 'react'
import { Mapa } from '../comp/Mapa'
import { Placa } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { AGORA, CLIMA, DATA_ATUAL, HOJE_TXT, SEDE, ZONAS, ZONA_POS, chuva14, diasUmidos, km, num, type Prioridade } from '../lib/dados'
import { minutos, totalM, useAtivos, useEstado, useRotaOrdenada, useTalhoes } from '../lib/estado'
import { pctParaLngLat } from '../lib/geo'
import { vai } from '../lib/rotas'

export function Hoje() {
  const e = useEstado()
  const ts = useTalhoes(e)
  const ativos = useAtivos(e)
  const r = useRotaOrdenada(e)
  const pend = e.insp.filter(i => i.st === 'pendente').length
  const ferrugem = ativos.find(a => a.clima)
  const hoje = CLIMA[CLIMA.length - 1]
  const pri = useMemo(() => Object.fromEntries(ativos.map(a => [a.t, a.pri])) as Record<string, Prioridade>, [ativos])
  const manchas = useMemo(() => ativos.filter(a => a.z != null).map(a => pctParaLngLat(ZONA_POS(ZONAS[a.z!]))), [ativos])
  const rotaMapa = useMemo(() => ({ sede: SEDE, paradas: r.map(p => ({ pos: p.pos, pri: p.a.pri })) }), [r])
  const todos = useMemo(() => ts.flatMap(t => t.contorno), [ts])
  const ordem = (id: string) => { const i = r.findIndex(p => p.a.t === id); return i < 0 ? undefined : i + 1 }
  const ordenados = [...ts].sort((a, b) => {
    const pa = ativos.find(x => x.t === a.id), pb = ativos.find(x => x.t === b.id)
    const v = (x?: typeof pa) => x ? { alta: 0, 'média': 1, baixa: 2 }[x.pri] : 3
    return v(pa) - v(pb) || a.num - b.num
  })

  return (
    <div className="pagina hoje">
      <div className="hoje-principal">
        <div className="cab">
          <div><h1>{HOJE_TXT}</h1><p>{ts.length} talhões monitorados · última imagem Sentinel-2 em 25/12/2025 · próxima passagem 30/12</p></div>
        </div>
        {pend > 0 && (
          <button className="aviso amarelo largo" onClick={() => vai('fila')}>
            <Icone n="enviar" /><div><b>{pend} inspeç{pend > 1 ? 'ões' : 'ão'} guardada{pend > 1 ? 's' : ''} no aparelho</b><span>Sobem assim que houver sinal.</span></div><span className="bt bt-t">Ver fila</span>
          </button>
        )}
        {ferrugem && (
          <div className="aviso">
            <Icone n="alertas" />
            <div><b>Risco de ferrugem-asiática no Talhão 1</b><span>Umidade igual ou acima de 88% em {diasUmidos} dos últimos 14 dias. Vale vistoriar o baixeiro das plantas.</span></div>
            <a className="bt bt-t" href={'#/alertas/' + ferrugem.id}>Ver alerta</a>
          </div>
        )}
        <a className="rota-cel" href="#/rota">
          <span><b>Rota de hoje</b>{r.length} pontos · {km(totalM(r))} · ~{minutos(r)} min</span>
          <span className="bt bt-c">Abrir rota</span>
        </a>
        <div className="grade-placas">
          {ordenados.map(t => <Placa key={t.id} t={t} data={DATA_ATUAL} alerta={ativos.find(a => a.t === t.id)} rota={ordem(t.id)} onClick={() => vai('talhao/' + t.id)} />)}
        </div>
      </div>

      <aside className="hoje-lado">
        <div className="mini-mapa">
          <Mapa data={DATA_ATUAL} camada="ndvi" talhoes={ts} priPorTalhao={pri} manchas={manchas} rota={rotaMapa} enquadrar={todos} margem={40} interativo={false} onTalhao={id => vai('talhao/' + id)} rotulo="Mapa da fazenda com a rota de hoje" />
          <a className="mapa-sobre selo-mapa" href="#/mapa">Abrir mapa <Icone n="seta" c="p" /></a>
        </div>
        <section className="painel clima" aria-label="Clima">
          <div className="clima-agora"><strong>{num(AGORA.t, 0)}°</strong><span>agora, 06:00<br />Rio Verde (GO)</span></div>
          <dl>
            <div><dt>Umidade</dt><dd>{AGORA.ur}%</dd></div>
            <div><dt>Máxima</dt><dd>{num(hoje.tmax, 0)}°</dd></div>
            <div><dt>Chuva 14 dias</dt><dd>{num(chuva14, 0)} mm</dd></div>
          </dl>
        </section>
        <section className="painel rota-card" aria-label="Rota de hoje">
          <h2 className="sec">Rota de hoje</h2>
          <ol className="paradas">
            {r.map((p, i) => (
              <li key={p.a.id}><b className={'num-placa ' + p.a.pri}>{i + 1}</b><div><b>{ts.find(t => t.id === p.a.t)?.nome} · {p.a.tipo.toLowerCase()}</b><span>+{km(p.m)} · prioridade {p.a.pri}</span></div></li>
            ))}
            {!r.length && <li className="nota">Nenhum ponto. Inclua alertas na rota.</li>}
          </ol>
          <div className="totais"><span><strong>{km(totalM(r))}</strong> saindo da sede</span><span><strong>~{minutos(r)} min</strong> com as inspeções</span></div>
          <div className="bts"><a className="bt bt-c" href="#/rota">Ajustar</a><button className="bt bt-a" disabled={!r.length} onClick={() => vai('navegar/0')}>Iniciar rota</button></div>
        </section>
      </aside>
    </div>
  )
}
