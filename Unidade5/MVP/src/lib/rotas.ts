import { useEffect, useState } from 'react'

// Navegação pelo hash (#/mapa, #/talhao/T1): o botão voltar do navegador e do celular funciona.
export function useRota(): string[] {
  const ler = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const [r, setR] = useState(ler)
  useEffect(() => {
    const f = () => setR(ler())
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return r
}
export const vai = (caminho: string) => { location.hash = '/' + caminho }
