import confetti from 'canvas-confetti'
import { blip } from '../sound'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function party(opts: { x?: number; y?: number } = {}) {
  blip('ding')
  if (reduced()) return
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { x: opts.x ?? 0.5, y: opts.y ?? 0.6 },
    colors: ['#ffc93c', '#ff6fae', '#4cc9f0', '#3ddc97', '#9b5de5', '#ff8c42'],
    scalar: 1.1,
  })
}
