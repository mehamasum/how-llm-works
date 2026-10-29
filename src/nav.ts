import { useEffect, useState } from 'react'
import { CHAPTERS, indexOf } from './chapters'

const read = () => indexOf(window.location.hash.replace(/^#\/?/, '') || 'hello')

export function useChapterIndex() {
  const [i, setI] = useState(read)
  useEffect(() => {
    const on = () => {
      setI(read())
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return i
}

export const goTo = (i: number) => {
  const c = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, i))]
  window.location.hash = '/' + c.id
}
export const goToId = (id: string) => (window.location.hash = '/' + id)
