import { useMemo, useRef, useState } from 'react'
import { Mapa } from '../comp/Mapa'
import { aviso } from '../comp/Pecas'
import { Icone } from '../comp/Icone'
import { DATA_ATUAL, num } from '../lib/dados'
import { muda, novoId, pode, registra, useEstado, useNdvi, useTalhoes } from '../lib/estado'
import { areaHa, dentroDaArea, lngLatParaPct, perimetroKm, type LngLat } from '../lib/geo'
import { vai } from '../lib/rotas'

/** Lê o primeiro polígono de um GeoJSON ou KML (formatos em que o CAR é baixado). */
export function lePoligono(txt: string): LngLat[] | null {
  try {
    const j = JSON.parse(txt)
    const geoms: { type: string; coordinates: unknown }[] = []
    const junta = (o: { type?: string; features?: unknown[]; geometry?: unknown; geometries?: unknown[] }) => {
      if (!o) return
      if (o.type === 'FeatureCollection') o.features?.forEach(f => junta(f as never))
      else if (o.type === 'Feature') junta(o.geometry as never)
      else if (o.type === 'GeometryCollection') o.geometries?.forEach(g => junta(g as never))
      else if (o.type === 'Polygon' || o.type === 'MultiPolygon') geoms.push(o as never)
    }
    junta(j)
    const g = geoms[0]; if (!g) return null
    const anel = (g.type === 'Polygon' ? (g.coordinates as number[][][])[0] : (g.coordinates as number[][][][])[0][0])
    return anel.slice(0, -1).map(c => [c[0], c[1]] as LngLat)
  } catch {
    const m = txt.match(/<coordinates>([\s\S]*?)<\/coordinates>/i)
    if (!m) return null
    const pts = m[1].trim().split(/\s+/).map(s => s.split(',').map(Number)).filter(c => c.length >= 2 && c.every(isFinite)).map(c => [c[0], c[1]] as LngLat)
    if (pts.length > 3 && pts[0][0] === pts[pts.length - 1][0]) pts.pop()
    return pts.length >= 3 ? pts : null
  }
}

export function Desenhar() {
  const e = useEstado()
  const ts = useTalhoes(e)
  const [pts, setPts] = useState<LngLat[]>([])
  const [nome, setNome] = useState('')
  const [cult, setCult] = useState<'Soja' | 'Milho'>('Soja')
  const [camada, setCamada] = useState<'ndvi' | 'rgb'>('rgb')
  const [origem, setOrigem] = useState<'desenho' | 'CAR'>('desenho')
  const [erro, setErro] = useState('')
  const arq = useRef<HTMLInputElement>(null)
  const pct = useMemo(() => pts.map(lngLatParaPct), [pts])
  const m = useNdvi(pts.length >= 3 ? pct : undefined, DATA_ATUAL)
  const ha = areaHa(pts)
  const desenho = useMemo(() => ({
    pts,
    onAdd: (p: LngLat) => { if (!dentroDaArea(p)) { setErro('Fora da área da imagem de satélite da fazenda.'); return } setErro(''); setPts(q => [...q, p]) },
    onMove: (i: number, p: LngLat) => setPts(q => q.map((x, k) => k === i ? p : x)),
  }), [pts])

  if (!pode(e, 'editar')) return <div className="pagina estreita"><div className="painel vazio"><Icone n="cadeado" c="g" /><h1>Só o produtor desenha talhões</h1><p className="nota">O agrônomo convidado vê os talhões, mas não altera.</p><a className="bt bt-v" href="#/talhoes">Ver talhões</a></div></div>

  const importar = async (f: File) => {
    const p = lePoligono(await f.text())
    if (!p) { setErro('Não achei um polígono nesse arquivo. Use o GeoJSON ou KML baixado do CAR.'); return }
    if (!p.some(dentroDaArea)) { setErro('O contorno do arquivo fica fora da área de exemplo (Rio Verde, GO).'); return }
    setPts(p.length > 40 ? p.filter((_, i) => i % Math.ceil(p.length / 40) === 0) : p); setOrigem('CAR'); setErro('')
    aviso('Contorno importado do CAR: confira os cantos no mapa')
  }
  const salvar = () => {
    const n = nome.trim() || 'Talhão ' + (7 + e.proprios.length)
    muda(x => ({ proprios: [...x.proprios, { id: novoId('P'), nome: n, cult, pct, origem }], safras: x.safras }))
    registra('cadastrou o ' + n + ' (' + num(ha, 1) + ' ha, ' + origem + ')')
    aviso(n + ' salvo com ' + num(ha, 1) + ' ha'); setPts([]); setNome(''); setOrigem('desenho')
  }

  return (
    <div className="tela-desenho">
      <div className="des-mapa">
        <Mapa data={DATA_ATUAL} camada={camada} talhoes={ts} desenho={desenho} rotulo="Mapa para desenhar o talhão: clique nos cantos" />
        <div className="mapa-sobre mapa-ctl"><div className="seg" role="group" aria-label="Camada">
          <button aria-pressed={camada === 'rgb'} onClick={() => setCamada('rgb')}>Cor real</button>
          <button aria-pressed={camada === 'ndvi'} onClick={() => setCamada('ndvi')}>Vigor (NDVI)</button>
        </div></div>
      </div>
      <section className="des-lado">
        <a className="voltar" href="#/talhoes"><Icone n="voltar" c="p" />Talhões</a>
        <div className="cab"><div><h1>Novo talhão</h1><p>Clique nos cantos do talhão no mapa e arraste para ajustar a borda</p></div></div>
        <dl className="ficha tres">
          <div><dt>Área</dt><dd>{ha ? num(ha, 1) + ' ha' : '-'}</dd></div>
          <div><dt>Perímetro</dt><dd>{pts.length > 2 ? num(perimetroKm(pts), 2) + ' km' : '-'}</dd></div>
          <div><dt>NDVI médio</dt><dd>{m ? num(m.media) : '-'}</dd></div>
        </dl>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <label className="rot" htmlFor="nome-t">Nome</label>
        <input id="nome-t" className="campo" value={nome} onChange={ev => setNome(ev.target.value)} placeholder={'Talhão ' + (7 + e.proprios.length)} maxLength={30} />
        <label className="rot" id="cult-rot">Cultura nesta safra</label>
        <div className="chips" role="group" aria-labelledby="cult-rot">
          {(['Soja', 'Milho'] as const).map(c => <button key={c} className="chip" aria-pressed={cult === c} onClick={() => setCult(c)}>{c}</button>)}
        </div>
        <div className="bts">
          <button className="bt bt-c" disabled={!pts.length} onClick={() => setPts(q => q.slice(0, -1))}>Desfazer canto</button>
          <button className="bt bt-a" disabled={pts.length < 3} onClick={salvar}>Salvar talhão</button>
        </div>
        <div className="painel car">
          <b>Importar do CAR</b>
          <p className="nota">Envie o contorno do Cadastro Ambiental Rural em GeoJSON ou KML (RF21).</p>
          <input ref={arq} type="file" accept=".geojson,.json,.kml" hidden onChange={ev => { const f = ev.target.files?.[0]; if (f) importar(f); ev.target.value = '' }} />
          <button className="bt bt-c" onClick={() => arq.current?.click()}><Icone n="upload" c="p" />Escolher arquivo</button>
        </div>
        <p className="nota">Imagem real do Sentinel-2 de 25/12/2025 sobre o fundo de satélite. A área é calculada pelas coordenadas dos cantos; o NDVI é a média das células de 20 m dentro do contorno.</p>
        {e.proprios.length > 0 && <button className="bt bt-t" onClick={() => vai('talhoes')}>Ver os {e.proprios.length} talhão(ões) que você desenhou</button>}
      </section>
    </div>
  )
}
