/// <reference lib="webworker" />
import { CORPUS } from './corpus'

// A real (tiny) neural network, trained from scratch in the browser: it reads 6 characters
// and predicts the 7th. Same idea as GPT, just ~10 thousand knobs instead of ~1 trillion.
const CHARS = [...new Set(CORPUS)].sort()
const V = CHARS.length
const stoi = new Map(CHARS.map((c, i) => [c, i]))
const data = Int32Array.from([...CORPUS].map((c) => stoi.get(c)!))
const CTX = 6
const EMB = 10
const HID = 96
const IN = CTX * EMB

const randn = () => Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random())
const init = (n: number, scale: number) => Float32Array.from({ length: n }, () => randn() * scale)

let E: Float32Array, W1: Float32Array, b1: Float32Array, W2: Float32Array, b2: Float32Array
const params = () => [E, W1, b1, W2, b2]
let m: Float32Array[] = []
let v: Float32Array[] = []
let step = 0

function reset() {
  E = init(V * EMB, 1)
  W1 = init(IN * HID, 1 / Math.sqrt(IN))
  b1 = new Float32Array(HID)
  W2 = init(HID * V, 0.01)
  b2 = new Float32Array(V)
  m = params().map((p) => new Float32Array(p.length))
  v = params().map((p) => new Float32Array(p.length))
  step = 0
}
reset()

const x = new Float32Array(IN)
const h = new Float32Array(HID)
const logits = new Float32Array(V)
const probs = new Float32Array(V)

function forward(ctx: ArrayLike<number>) {
  for (let i = 0; i < CTX; i++) for (let j = 0; j < EMB; j++) x[i * EMB + j] = E[ctx[i] * EMB + j]
  for (let k = 0; k < HID; k++) {
    let s = b1[k]
    for (let i = 0; i < IN; i++) s += x[i] * W1[i * HID + k]
    h[k] = Math.tanh(s)
  }
  let max = -Infinity
  for (let c = 0; c < V; c++) {
    let s = b2[c]
    for (let k = 0; k < HID; k++) s += h[k] * W2[k * V + c]
    logits[c] = s
    if (s > max) max = s
  }
  let z = 0
  for (let c = 0; c < V; c++) z += probs[c] = Math.exp(logits[c] - max)
  for (let c = 0; c < V; c++) probs[c] /= z
}

function trainStep(batch: number, lr: number) {
  const grads = params().map((p) => new Float32Array(p.length))
  const [gE, gW1, gb1, gW2, gb2] = grads
  const dh = new Float32Array(HID)
  const dx = new Float32Array(IN)
  let loss = 0
  for (let b = 0; b < batch; b++) {
    const i = Math.floor(Math.random() * (data.length - CTX - 1))
    const ctx = data.subarray(i, i + CTX)
    const y = data[i + CTX]
    forward(ctx)
    loss += -Math.log(probs[y] + 1e-9)
    dh.fill(0)
    for (let c = 0; c < V; c++) {
      const d = (probs[c] - (c === y ? 1 : 0)) / batch
      gb2[c] += d
      for (let k = 0; k < HID; k++) {
        gW2[k * V + c] += h[k] * d
        dh[k] += W2[k * V + c] * d
      }
    }
    dx.fill(0)
    for (let k = 0; k < HID; k++) {
      const da = dh[k] * (1 - h[k] * h[k])
      gb1[k] += da
      for (let j = 0; j < IN; j++) {
        gW1[j * HID + k] += x[j] * da
        dx[j] += W1[j * HID + k] * da
      }
    }
    for (let p = 0; p < CTX; p++) for (let j = 0; j < EMB; j++) gE[ctx[p] * EMB + j] += dx[p * EMB + j]
  }
  // Adam: nudge every knob a little in the direction that lowers the loss.
  step++
  const b1c = 1 - 0.9 ** step
  const b2c = 1 - 0.999 ** step
  params().forEach((p, pi) => {
    const g = grads[pi], mm = m[pi], vv = v[pi]
    for (let i = 0; i < p.length; i++) {
      mm[i] = 0.9 * mm[i] + 0.1 * g[i]
      vv[i] = 0.999 * vv[i] + 0.001 * g[i] * g[i]
      p[i] -= (lr * (mm[i] / b1c)) / (Math.sqrt(vv[i] / b2c) + 1e-8)
    }
  })
  return loss / batch
}

function sample(n: number, seed = 'once u') {
  const ctx = [...seed.padStart(CTX, ' ')].slice(-CTX).map((c) => stoi.get(c) ?? stoi.get(' ')!)
  let out = ''
  for (let i = 0; i < n; i++) {
    forward(ctx)
    let r = Math.random(), c = 0
    for (; c < V - 1; c++) { r -= probs[c]; if (r <= 0) break }
    out += CHARS[c]
    ctx.shift(); ctx.push(c)
  }
  return seed + out
}

// A handful of real weights to drive the knob animation.
const knobs = () => Array.from({ length: 48 }, (_, i) => W1[(i * 997) % W1.length])

let running = false
self.onmessage = (e: MessageEvent) => {
  const msg = e.data as { type: 'start' | 'stop' | 'reset'; steps?: number }
  if (msg.type === 'reset') {
    running = false
    reset()
    postMessage({ type: 'progress', step: 0, loss: Math.log(V), sample: sample(80), knobs: knobs(), done: false })
    return
  }
  if (msg.type === 'stop') { running = false; return }
  running = true
  const total = msg.steps ?? 1500
  const tick = () => {
    if (!running) return
    let loss = 0
    const chunk = 25
    for (let i = 0; i < chunk && step < total; i++) loss = trainStep(32, 0.01)
    const done = step >= total
    postMessage({ type: 'progress', step, loss, sample: step % 100 === 0 || done ? sample(80) : null, knobs: knobs(), done })
    if (done) running = false
    else setTimeout(tick, 0)
  }
  tick()
}

postMessage({ type: 'ready', vocab: V, params: params().reduce((s, p) => s + p.length, 0), loss: Math.log(V), sample: sample(80), knobs: knobs() })
