import { CORPUS } from './corpus'

// A tiny word-level "language model": it counts which word follows which pair of words in
// our story corpus, and falls back to shorter contexts when it has never seen a pair.
export type Choice = { word: string; p: number }

const words = (s: string) => s.toLowerCase().match(/[a-z']+|[.,!?]/g) ?? []

const TOKENS = words(CORPUS)
const tri = new Map<string, Map<string, number>>()
const bi = new Map<string, Map<string, number>>()
const uni = new Map<string, number>()

const bump = (m: Map<string, Map<string, number>>, k: string, w: string) => {
  const inner = m.get(k) ?? new Map<string, number>()
  inner.set(w, (inner.get(w) ?? 0) + 1)
  m.set(k, inner)
}
for (let i = 0; i < TOKENS.length; i++) {
  const w = TOKENS[i]
  uni.set(w, (uni.get(w) ?? 0) + 1)
  if (i >= 1) bump(bi, TOKENS[i - 1], w)
  if (i >= 2) bump(tri, TOKENS[i - 2] + ' ' + TOKENS[i - 1], w)
}

export const VOCAB = [...uni.keys()]
export const knows = (w: string) => uni.has(w.toLowerCase())

export function nextChoices(context: string, temperature = 1): Choice[] {
  const ws = words(context)
  const a = ws[ws.length - 2]
  const b = ws[ws.length - 1]
  // Blend what usually follows the last two words, the last word, and any word at all.
  // The blend keeps a few surprising options on the wheel even when the story book is tiny.
  const layers: [Map<string, number> | undefined, number][] = [
    [a && b ? tri.get(a + ' ' + b) : undefined, 0.6],
    [b ? bi.get(b) : undefined, 0.3],
    [uni, 0.1],
  ]
  const probs = new Map<string, number>()
  let used = 0
  for (const [counts, weight] of layers) {
    if (!counts) continue
    used += weight
    const total = [...counts.values()].reduce((s, c) => s + c, 0)
    for (const [w, c] of counts) probs.set(w, (probs.get(w) ?? 0) + (weight * c) / total)
  }
  const t = Math.max(0.05, temperature)
  // Temperature reshapes the chances: low = play it safe, high = take wild guesses.
  const weighted = [...probs.entries()].map(([w, p]) => [w, Math.pow(p / used, 1 / t)] as const)
  const total = weighted.reduce((s, [, c]) => s + c, 0)
  return weighted
    .map(([word, c]) => ({ word, p: c / total }))
    .sort((x, y) => y.p - x.p)
}

// Top-N choices plus an "everything else" slice so the wheel stays readable.
export function wheelSlices(context: string, temperature: number, n = 6): Choice[] {
  const all = nextChoices(context, temperature)
  const top = all.slice(0, n)
  const rest = all.slice(n).reduce((s, c) => s + c.p, 0)
  return rest > 0.005 ? [...top, { word: '…other', p: rest }] : top
}

export function sampleFrom(choices: Choice[], r = Math.random()): Choice {
  let acc = 0
  for (const c of choices) {
    acc += c.p
    if (r <= acc) return c
  }
  return choices[choices.length - 1]
}

// Picks a real word when the wheel lands on "…other".
export function resolveOther(context: string, temperature: number, n = 6): string {
  const rest = nextChoices(context, temperature).slice(n)
  if (!rest.length) return '.'
  const total = rest.reduce((s, c) => s + c.p, 0)
  return sampleFrom(rest.map((c) => ({ ...c, p: c.p / total }))).word
}

export const join = (ws: string[]) => ws.join(' ').replace(/ ([.,!?])/g, '$1')
