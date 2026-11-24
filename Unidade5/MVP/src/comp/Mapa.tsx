import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, ImageSource, MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

// o Vite empacota o worker do MapLibre (com as dependências) num arquivo próprio
maplibregl.setWorkerUrl(workerUrl)
import { IMAGENS, type Prioridade, type Talhao } from '../lib/dados'
import { BBOX, CANTOS_CENA, aoLongo, type LngLat } from '../lib/geo'

export interface ParadaMapa { pos: LngLat; pri: Prioridade; feita?: boolean; ativa?: boolean }
interface Props {
  data: string
  camada: 'ndvi' | 'rgb'
  talhoes?: Talhao[]
  priPorTalhao?: Record<string, Prioridade | undefined>
  sel?: string
  onTalhao?: (id: string) => void
  manchas?: LngLat[]
  rota?: { sede: LngLat; paradas: ParadaMapa[] }
  eu?: LngLat | null
  desenho?: { pts: LngLat[]; onAdd: (p: LngLat) => void; onMove: (i: number, p: LngLat) => void }
  enquadrar?: LngLat[]
  interativo?: boolean
  rotulo?: string
  folga?: number
  margem?: number
  extra?: 'solo' | 'relevo' | null
  soloUrl?: string
}

// ds-allow-hardcode: MapLibre paint properties cannot read CSS variables; these colors mirror the tokens in index.css
const BASE = import.meta.env.BASE_URL
const url = (d: string, c: 'ndvi' | 'rgb') => BASE + IMAGENS[d][c]
const vazio = { type: 'FeatureCollection' as const, features: [] }

function el(cls: string, txt = '') { const d = document.createElement('div'); d.className = cls; d.textContent = txt; return d }
const CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
function parada(cls: string, n: number, feita?: boolean) { const d = el(cls, feita ? '' : String(n)); if (feita) d.innerHTML = CHECK; return d }

export function Mapa(p: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const mapa = useRef<maplibregl.Map | null>(null)
  const marc = useRef<Record<string, maplibregl.Marker[]>>({})
  const lado = useRef<'a' | 'b'>('a')
  const [pronto, setPronto] = useState(false)
  const cb = useRef(p); cb.current = p

  // cria o mapa uma vez
  useEffect(() => {
    const m = new maplibregl.Map({
      container: caixa.current!,
      style: {
        version: 8,
        sources: {
          fundo: {
            type: 'raster', tileSize: 256, maxzoom: 18,
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            attribution: 'Fundo: Esri World Imagery · Cenas: Copernicus Sentinel-2',
          },
          'cena-a': { type: 'image', url: url(p.data, p.camada), coordinates: CANTOS_CENA },
          'cena-b': { type: 'image', url: url(p.data, p.camada), coordinates: CANTOS_CENA },
          talhoes: { type: 'geojson', data: vazio },
          rota: { type: 'geojson', data: vazio },
          desenho: { type: 'geojson', data: vazio },
          fora: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]], [...CANTOS_CENA, CANTOS_CENA[0]]] } } },
          relevo: { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, maxzoom: 14, attribution: 'Relevo: Mapzen Terrain Tiles (AWS)' },
          solo: { type: 'image', url: url(p.data, 'ndvi'), coordinates: CANTOS_CENA },
        },
        layers: [
          { id: 'chao', type: 'background', paint: { 'background-color': '#24302B' } },
          { id: 'fundo', type: 'raster', source: 'fundo', paint: { 'raster-saturation': -0.25 } },
          { id: 'cena-a', type: 'raster', source: 'cena-a', paint: { 'raster-opacity': 1, 'raster-opacity-transition': { duration: 650, delay: 0 }, 'raster-fade-duration': 0 } },
          { id: 'cena-b', type: 'raster', source: 'cena-b', paint: { 'raster-opacity': 0, 'raster-opacity-transition': { duration: 650, delay: 0 }, 'raster-fade-duration': 0 } },
          { id: 'fora', type: 'fill', source: 'fora', paint: { 'fill-color': '#173022', 'fill-opacity': 0.62 } },
          { id: 'moldura', type: 'line', source: 'fora', paint: { 'line-color': '#E8B10D', 'line-width': 2, 'line-dasharray': [3, 2] } },
          { id: 'relevo', type: 'hillshade', source: 'relevo', layout: { visibility: 'none' }, paint: { 'hillshade-exaggeration': 1, 'hillshade-shadow-color': '#1B2A20', 'hillshade-highlight-color': '#F3E9C6', 'hillshade-accent-color': '#5A6453' } },
          { id: 'solo', type: 'raster', source: 'solo', layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.85, 'raster-resampling': 'nearest' } },
          { id: 'tal-fill', type: 'fill', source: 'talhoes', paint: { 'fill-color': ['match', ['get', 'pri'], 'alta', '#9C3A22', '#F3E9C6'], 'fill-opacity': ['case', ['get', 'sel'], 0.28, 0.08] } },
          { id: 'tal-linha', type: 'line', source: 'talhoes', paint: { 'line-color': ['case', ['get', 'sel'], '#E8B10D', ['match', ['get', 'pri'], 'alta', '#FFFFFF', '#F3E9C6']], 'line-width': ['case', ['get', 'sel'], 3.5, 2] } },
          { id: 'rota-sombra', type: 'line', source: 'rota', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#173022', 'line-width': 7, 'line-opacity': 0.55 } },
          { id: 'rota', type: 'line', source: 'rota', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#E8B10D', 'line-width': 3.5, 'line-dasharray': [2, 1.4] } },
          { id: 'des-fill', type: 'fill', source: 'desenho', paint: { 'fill-color': '#E8B10D', 'fill-opacity': 0.25 } },
          { id: 'des-linha', type: 'line', source: 'desenho', paint: { 'line-color': '#E8B10D', 'line-width': 3 } },
        ],
      },
      bounds: [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[3]]],
      fitBoundsOptions: { padding: 12 },
      maxBounds: [[BBOX[0] - 0.08, BBOX[1] - 0.06], [BBOX[2] + 0.08, BBOX[3] + 0.06]],
      attributionControl: { compact: true },
      dragRotate: false, pitchWithRotate: false, touchPitch: false,
      cooperativeGestures: false,
    })
    m.touchZoomRotate.disableRotation()
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    // não espera os ladrilhos do fundo: basta o estilo estar carregado
    const marca = () => { if (m.isStyleLoaded()) setPronto(true) }
    m.on('load', () => setPronto(true)); m.on('styledata', marca); m.on('idle', marca)
    m.on('click', 'tal-fill', (e: MapLayerMouseEvent) => { const id = e.features?.[0]?.properties?.id; if (id && cb.current.onTalhao) cb.current.onTalhao(id) })
    m.on('mouseenter', 'tal-fill', () => { if (cb.current.onTalhao) m.getCanvas().style.cursor = 'pointer' })
    m.on('mouseleave', 'tal-fill', () => { m.getCanvas().style.cursor = '' })
    m.on('click', (e: maplibregl.MapMouseEvent) => { const d = cb.current.desenho; if (d) d.onAdd([e.lngLat.lng, e.lngLat.lat]) })
    mapa.current = m
    const ro = new ResizeObserver(() => m.resize()); ro.observe(caixa.current!)
    return () => { ro.disconnect(); m.remove(); mapa.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const troca = (grupo: string, novos: maplibregl.Marker[]) => {
    marc.current[grupo]?.forEach(x => x.remove())
    marc.current[grupo] = novos
  }

  // cena: cruza a imagem nova por cima da anterior
  useEffect(() => {
    const m = mapa.current; if (!m || !pronto) return
    const prox = lado.current === 'a' ? 'b' : 'a'
    const src = m.getSource('cena-' + prox) as ImageSource
    const u = url(p.data, p.camada)
    const im = new Image()
    im.onload = () => {
      src.updateImage({ url: u, coordinates: CANTOS_CENA })
      m.setPaintProperty('cena-' + prox, 'raster-opacity', 1)
      m.setPaintProperty('cena-' + lado.current, 'raster-opacity', 0)
      lado.current = prox
    }
    im.src = u
  }, [p.data, p.camada, pronto])

  // talhões e rótulos-placa
  useEffect(() => {
    const m = mapa.current; if (!m || !pronto) return
    const ts = p.talhoes || []
    ;(m.getSource('talhoes') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: ts.map(t => ({ type: 'Feature', properties: { id: t.id, pri: p.priPorTalhao?.[t.id] || 'ok', sel: t.id === p.sel }, geometry: { type: 'Polygon', coordinates: [[...t.contorno, t.contorno[0]]] } })),
    })
    troca('tal', ts.map(t => {
      const d = el('rot-tal ' + (p.priPorTalhao?.[t.id] === 'alta' ? 'alta ' : '') + (t.id === p.sel ? 'sel' : ''), String(t.num).padStart(2, '0'))
      d.setAttribute('role', 'button'); d.setAttribute('aria-label', t.nome); d.tabIndex = cb.current.onTalhao ? 0 : -1
      d.onclick = ev => { ev.stopPropagation(); cb.current.onTalhao?.(t.id) }
      d.onkeydown = ev => { if (ev.key === 'Enter') cb.current.onTalhao?.(t.id) }
      if (!cb.current.onTalhao) d.style.pointerEvents = 'none'
      if (!p.rota) return new maplibregl.Marker({ element: d }).setLngLat(t.centro).addTo(m)
      const topo = t.contorno.reduce((a, q) => q[1] > a[1] ? q : a, t.contorno[0])
      return new maplibregl.Marker({ element: d, anchor: 'bottom', offset: [0, -4] }).setLngLat([t.centro[0] * 0.5 + topo[0] * 0.5, topo[1]]).addTo(m)
    }))
  }, [p.talhoes, p.priPorTalhao, p.sel, !!p.rota, pronto])

  // manchas detectadas
  useEffect(() => {
    const m = mapa.current; if (!m || !pronto) return
    troca('mancha', (p.manchas || []).map(c => new maplibregl.Marker({ element: el('mancha') }).setLngLat(c).addTo(m)))
  }, [p.manchas, pronto])

  // rota: a linha se desenha da sede até o último ponto
  const chaveRota = JSON.stringify(p.rota?.paradas.map(x => x.pos))
  useEffect(() => {
    const m = mapa.current; if (!m || !pronto) return
    const src = m.getSource('rota') as GeoJSONSource
    if (!p.rota) { src.setData(vazio); troca('rota', []); return }
    const cam = [p.rota.sede, ...p.rota.paradas.map(x => x.pos)]
    let raf = 0; const t0 = performance.now(), dur = 1100
    const passo = (t: number) => {
      const f = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - f, 3)
      const parcial: LngLat[] = []
      if (cam.length > 1) { for (let i = 0; i <= 40; i++) parcial.push(aoLongo(cam, (i / 40) * e)) }
      src.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: parcial } })
      if (f < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveRota, pronto])
  useEffect(() => {
    const m = mapa.current; if (!m || !pronto || !p.rota) return
    troca('rota', [
      new maplibregl.Marker({ element: el('sede') }).setLngLat(p.rota.sede).addTo(m),
      ...p.rota.paradas.map((x, i) => new maplibregl.Marker({ element: parada('parada ' + x.pri + (x.feita ? ' feita' : '') + (x.ativa ? ' ativa' : ''), i + 1, x.feita) }).setLngLat(x.pos).addTo(m)),
    ])
  }, [p.rota, pronto])

  // camadas extras: relevo (RF23) e uso do solo (RF22)
  useEffect(() => {
    const m = mapa.current; if (!m || !pronto) return
    m.setLayoutProperty('relevo', 'visibility', p.extra === 'relevo' ? 'visible' : 'none')
    if (p.soloUrl) (m.getSource('solo') as ImageSource).updateImage({ url: p.soloUrl, coordinates: CANTOS_CENA })
    m.setLayoutProperty('solo', 'visibility', p.extra === 'solo' && p.soloUrl ? 'visible' : 'none')
    m.setPaintProperty('cena-a', 'raster-opacity', p.extra === 'relevo' ? 0 : lado.current === 'a' ? 1 : 0)
    m.setPaintProperty('cena-b', 'raster-opacity', p.extra === 'relevo' ? 0 : lado.current === 'b' ? 1 : 0)
  }, [p.extra, p.soloUrl, pronto])

  // posição atual
  useEffect(() => {
    const m = mapa.current; if (!m || !pronto) return
    troca('eu', p.eu ? [new maplibregl.Marker({ element: el('eu') }).setLngLat(p.eu).addTo(m)] : [])
  }, [p.eu, pronto])

  // desenho de talhão: cantos arrastáveis
  const nDes = p.desenho?.pts.length ?? -1
  useEffect(() => {
    const m = mapa.current; if (!m || !pronto) return
    const pts = p.desenho?.pts || []
    ;(m.getSource('desenho') as GeoJSONSource).setData(pts.length >= 2
      ? { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...pts, pts[0]]] } } : vazio)
    m.getCanvas().style.cursor = p.desenho ? 'crosshair' : ''
  }, [p.desenho, pronto])
  useEffect(() => {
    const m = mapa.current; if (!m || !pronto) return
    const pts = cb.current.desenho?.pts || []
    troca('vert', pts.map((q, i) => {
      const k = new maplibregl.Marker({ element: el('vert'), draggable: true }).setLngLat(q).addTo(m)
      k.getElement().setAttribute('aria-label', 'Canto ' + (i + 1))
      k.on('drag', () => { const l = k.getLngLat(); cb.current.desenho?.onMove(i, [l.lng, l.lat]) })
      k.getElement().addEventListener('click', (ev: MouseEvent) => ev.stopPropagation())
      return k
    }))
  }, [nDes, pronto])

  // enquadramento
  const chaveEnq = JSON.stringify(p.enquadrar)
  useEffect(() => {
    const m = mapa.current; if (!m || !pronto || !p.enquadrar?.length) return
    const b = new maplibregl.LngLatBounds(p.enquadrar[0], p.enquadrar[0])
    p.enquadrar.forEach(q => b.extend(q))
    const w = caixa.current?.clientWidth || 0
    const pad = p.margem != null ? p.margem : w > 760 ? { top: 110, bottom: 190, left: 60, right: 60 + (p.folga || 0) } : { top: 70, bottom: 150, left: 30, right: 30 }
    m.fitBounds(b, { padding: pad, maxZoom: 14.6, duration: 900 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveEnq, pronto])

  useEffect(() => {
    const m = mapa.current; if (!m) return
    const on = p.interativo !== false
    for (const h of [m.dragPan, m.scrollZoom, m.doubleClickZoom, m.touchZoomRotate, m.boxZoom, m.keyboard]) { if (on) h.enable(); else h.disable() }
  }, [p.interativo])

  return <div ref={caixa} className="mapa" role="region" aria-label={p.rotulo || 'Mapa da fazenda'} />
}
