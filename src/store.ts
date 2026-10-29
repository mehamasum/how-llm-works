import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Mode = 'kid' | 'curious'

type State = {
  sentence: string
  mode: Mode
  sound: boolean
  stickers: string[]
  setSentence: (s: string) => void
  setMode: (m: Mode) => void
  toggleSound: () => void
  earn: (id: string) => void
}

export const useApp = create<State>()(
  persist(
    (set) => ({
      sentence: 'Once upon a time, a little robot wanted to learn to talk.',
      mode: 'kid',
      sound: false,
      stickers: [],
      setSentence: (sentence) => set({ sentence }),
      setMode: (mode) => set({ mode }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      earn: (id) => set((s) => (s.stickers.includes(id) ? s : { stickers: [...s.stickers, id] })),
    }),
    { name: 'how-llms-work' },
  ),
)
