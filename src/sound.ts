import { useApp } from './store'

let ctx: AudioContext | null = null

// Tiny synth blips so we don't ship audio files. Muted unless the visitor turns sound on.
export function blip(kind: 'pop' | 'ding' | 'boop' | 'tick' = 'pop') {
  if (!useApp.getState().sound) return
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const t = ctx.currentTime
    const f = { pop: [520, 880], ding: [880, 1320], boop: [300, 180], tick: [1200, 1200] }[kind]
    const dur = kind === 'tick' ? 0.03 : 0.18
    o.type = kind === 'boop' ? 'triangle' : 'sine'
    o.frequency.setValueAtTime(f[0], t)
    o.frequency.exponentialRampToValueAtTime(f[1], t + dur)
    g.gain.setValueAtTime(0.18, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + dur)
  } catch {
    /* audio not available */
  }
}
