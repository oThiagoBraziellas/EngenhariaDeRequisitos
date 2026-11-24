const P: Record<string, string> = {
  hoje: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5.5h4V20',
  mapa: 'M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20',
  rota: 'M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16',
  alertas: 'M12 3.5 2.8 19.5h18.4zM12 10v4.5M12 17.2v.1',
  perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1-3.6 3.9-5.5 7.5-5.5s6.5 1.9 7.5 5.5',
  voltar: 'M15 5l-7 7 7 7',
  seta: 'M9 5l7 7-7 7',
  camera: 'M3.5 8h3.5l2-3h6l2 3h3.5v11.5h-17zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  nuvem: 'M7 18.5a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.4 11 3.8 3.8 0 0 1 18 18.5z',
  play: 'M8 5.5v13l11-6.5z',
  pausa: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  mais: 'M12 5v14M5 12h14',
  lapis: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  lixo: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13',
  sinal: 'M4 19h2M9 15h2v4H9zM14 11h2v8h-2zM19 6h2v13h-2z',
  gota: 'M12 3.5c3.5 4.5 6 7.7 6 10.7a6 6 0 0 1-12 0c0-3 2.5-6.2 6-10.7z',
  termo: 'M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z',
  bussola: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  alvo: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3',
  baixar: 'M12 4v11M7 10.5l5 5 5-5M5 20h14',
  enviar: 'M12 20V9M7 13.5l5-5 5 5M5 4h14',
  folha: 'M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7',
  camada: 'M12 3.5l9 4.8-9 4.8-9-4.8zM3 12.6l9 4.8 9-4.8',
  chat: 'M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5',
  equipe: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.8-3.3 3.3-5 6.5-5s5.7 1.7 6.5 5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 15c2 .6 3.2 2.3 3.5 5',
  modelo: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12 4 7.5',
  olho: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z',
  olhoX: 'M4 4l16 16M9.9 5.8A9.6 9.6 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-2.6 3.4M6.3 7.4C3.9 9.2 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1M10 10.1a2.8 2.8 0 0 0 3.9 3.9',
  celular: 'M7.5 3h9v18h-9zM11 18h2',
  cadeado: 'M6 10.5h12V20H6zM8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3M12 14v2.5',
  arq: 'M3.5 4h7v6h-7zM13.5 4h7v6h-7zM8.5 14h7v6h-7zM7 10v2h10v-2M12 12v2',
  lista: 'M9 6h11M9 12h11M9 18h11M4 6h.1M4 12h.1M4 18h.1',
  menu: 'M4 7h16M4 12h16M4 17h16',
  upload: 'M12 15V4M7 8.5l5-5 5 5M5 14v6h14v-6',
  impressora: 'M7 9V3.5h10V9M6.5 17H4V9h16v8h-2.5M7 14h10v6.5H7z',
  whats: 'M4 20l1.3-4A8 8 0 1 1 8 18.7zM9 9.5c.3 2.3 2.2 4.2 4.5 4.6l1.2-1.2 2 1-.4 1.6c-3.9.2-7.6-3.5-7.4-7.4L10.5 7.7l1 2z',
  sino: 'M6 9a6 6 0 1 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9zM10 20.5a2 2 0 0 0 4 0',
  'seta-cheia': 'M12 2.5l7 18-7-4-7 4z',
  relevo: 'M3 19l5.5-9 3.5 5.5 2.5-3.5L21 19z',
}

export function Icone({ n, c = '', titulo }: { n: keyof typeof P | string; c?: string; titulo?: string }) {
  return (
    <svg className={'ic ' + c} viewBox="0 0 24 24" aria-hidden={titulo ? undefined : true} role={titulo ? 'img' : undefined}>
      {titulo && <title>{titulo}</title>}
      <path d={P[n]} />
    </svg>
  )
}
