import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { Bead } from '../three/Bead'
import { useFit } from '../three/useFit'
import { colorFor } from '../ui/colors'
import { useApp } from '../store'
import { blip } from '../sound'
import { party } from '../ui/confetti'

const LAYERS = 6
const BOTTOM = -2.3
const TOP = 1.75 // where the output bars stand
const layerY = (k: number) => BOTTOM + 0.6 + k * ((1.2 - BOTTOM - 0.6) / (LAYERS - 1))
const TRIP = 1.8 // seconds for the beads' signal to climb the whole stack

// A toy next-bead guess with two knobs, written out as plain maths: score = knob1 × a + knob2 × b.
const CANDIDATES = [
  { word: 'star', a: 1, b: 0.6, color: '#ffc93c' },
  { word: 'car', a: 0.2, b: 1, color: '#4cc9f0' },
  { word: 'soup', a: -0.5, b: 0.3, color: '#ff6fae' },
]
function chances(k1: number, k2: number) {
  const scores = CANDIDATES.map((c) => k1 * c.a + k2 * c.b)
  const m = Math.max(...scores)
  const ex = scores.map((s) => Math.exp(s - m))
  const sum = ex.reduce((a, b) => a + b, 0)
  return ex.map((e) => e / sum)
}

const QUESTIONS = [
  { id: 'easy', label: '😌 Easy: “2 + 2 =”', beads: 4 },
  { id: 'hard', label: '😵 Hard: “47 × 389 =”', beads: 6 },
]

function LayerStack({ pulse, beads, probs, onLayer }: { pulse: number; beads: number; probs: number[]; onLayer: (k: number) => void }) {
  const s = useFit(6.4, 7)
  const t = useRef(-1)
  const last = useRef(-1)
  const spark = useRef<THREE.Mesh>(null)
  const slabs = useRef<(THREE.Mesh | null)[]>([])

  useEffect(() => { if (pulse > 0) { t.current = 0; last.current = -1 } }, [pulse])

  useFrame((_, dt) => {
    const running = t.current >= 0 && t.current <= TRIP
    if (running) t.current += dt
    const p = THREE.MathUtils.clamp(t.current / TRIP, 0, 1)
    const y = BOTTOM + p * (TOP - BOTTOM)
    if (spark.current) {
      spark.current.visible = running
      spark.current.position.y = y
    }
    // Light each layer as the signal passes through it, and report how many it has crossed.
    let passed = -1
    slabs.current.forEach((m, k) => {
      if (!m) return
      const d = Math.abs(y - layerY(k))
      const mat = m.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, running && d < 0.35 ? 1.1 : 0.12, 0.2)
      if (t.current >= 0 && y >= layerY(k)) passed = k
    })
    // Only report while the signal is travelling, so the counter keeps its final value afterwards.
    if (t.current >= 0 && passed !== last.current) { last.current = passed; onLayer(passed + 1) }
    if (t.current > TRIP) t.current = -1
  })

  return (
    <group scale={s}>
      <Sprinkles count={18} />
      {/* The beads going in at the bottom */}
      {Array.from({ length: beads }, (_, i) => (
        <Bead key={`${beads}-${i}`} position={[(i - (beads - 1) / 2) * 0.62, BOTTOM - 0.15, 0.3]} color={colorFor(i)} size={0.22} delay={i * 0.05} phase={i} />
      ))}
      {/* The stack of maths layers, each one mixing the beads with its knobs */}
      {Array.from({ length: LAYERS }, (_, k) => (
        <group key={k} position={[0, layerY(k), 0]}>
          <RoundedBox ref={(m) => { slabs.current[k] = m as unknown as THREE.Mesh }} args={[4.2, 0.22, 1.4]} radius={0.1}>
            <meshStandardMaterial color="#9b5de5" emissive="#f15bb5" emissiveIntensity={0.12} transparent opacity={0.75} />
          </RoundedBox>
          {[-1.5, -0.75, 0, 0.75, 1.5].map((x) => (
            <mesh key={x} position={[x, 0, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
              <meshStandardMaterial color="#fff6e5" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh ref={spark} visible={false} position={[0, BOTTOM, 0.8]}>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshStandardMaterial color="#fff" emissive="#ffc93c" emissiveIntensity={2} />
      </mesh>
      {/* The output at the top: chances for the next bead */}
      {CANDIDATES.map((c, i) => {
        const h = 0.1 + probs[i] * 1.1
        return (
          <group key={c.word} position={[(i - 1) * 1.3, TOP, 0]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[0.6, h, 0.4]} />
              <meshStandardMaterial color={c.color} />
            </mesh>
            <Html position={[0, h + 0.25, 0.3]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
              <div className="tag" style={{ background: '#fff', color: '#2b2140' }}>{c.word} {Math.round(probs[i] * 100)}%</div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

export default function Inside() {
  const earn = useApp((s) => s.earn)
  const [pulse, setPulse] = useState(0)
  const [layer, setLayer] = useState(0)
  const [k1, setK1] = useState(-1)
  const [k2, setK2] = useState(1)
  const [asked, setAsked] = useState<string[]>([])
  const [current, setCurrent] = useState(QUESTIONS[0])
  const probs = chances(k1, k2)
  const tuned = probs[0] > 0.6

  useEffect(() => { if (tuned) earn('inside') }, [tuned, earn])

  const send = () => { setPulse((p) => p + 1); blip('pop') }
  const ask = (q: (typeof QUESTIONS)[number]) => {
    setCurrent(q)
    send()
    if (!asked.includes(q.id)) {
      const a = [...asked, q.id]
      setAsked(a)
      if (a.length === QUESTIONS.length) setTimeout(() => party(), TRIP * 1000)
    }
  }
  const counter = <span className="tag">🧱 layers passed: {layer} / {LAYERS}</span>

  return (
    <Chapter title="Inside Toki's Head" sub="What the knobs actually do with your beads"
      steps={[
        {
          title: '🔬 Open the box',
          body: <>
            <Explain
              kid={<>
                <p>Let's peek inside! The beads go in at the <b>bottom</b>. They climb up through a tall <b>stack of layers</b> 👉. In every layer, the bead numbers get mixed with the knob numbers: multiply, add, squish, and pass it up.</p>
                <p>Out of the <b>top</b> comes a chance for every possible next bead. That's it: no magic, just lots and lots of maths.</p>
              </>}
              curious={<>
                <p>The network is a <b>Transformer</b>: a fixed stack of layers. In each layer, tokens first swap information with each other (<b>attention</b>), then each one is processed on its own (a small <b>MLP</b>). The parameters are the numbers used in those multiplications.</p>
                <p>Our toy has {LAYERS} layers; Llama 3.1 405B has 126. The final layer outputs a probability for each of the ~200,000 tokens.</p>
              </>}
            />
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button className="btn pink" onClick={send}>▶ Send beads through</button>
              {pulse > 0 && counter}
            </div>
          </>,
          next: 'What is a knob, really?',
        },
        {
          title: '🎛️ Twiddle two knobs',
          body: <>
            <Explain
              kid={<p>Here's a tiny brain with just <b>two knobs</b>, finishing <b>“Twinkle, twinkle, little ___”</b>. Each word's score is plain maths: <code>knob1 × a + knob2 × b</code>. Turn the knobs until <b>star</b> gets the biggest bar!</p>}
              curious={<p>Each candidate gets a score <code>k₁·a + k₂·b</code>, and a <b>softmax</b> turns scores into probabilities. A real model is the same idea as one giant expression with billions of knobs, and training turns them automatically (with gradient descent) instead of by hand.</p>}
            />
            <label style={{ display: 'block', marginTop: 10, fontWeight: 800 }}>Knob 1: {k1.toFixed(1)}
              <input type="range" min={-3} max={3} step={0.1} value={k1} onChange={(e) => setK1(+e.target.value)} style={{ width: '100%' }} />
            </label>
            <label style={{ display: 'block', marginTop: 6, fontWeight: 800 }}>Knob 2: {k2.toFixed(1)}
              <input type="range" min={-3} max={3} step={0.1} value={k2} onChange={(e) => setK2(+e.target.value)} style={{ width: '100%' }} />
            </label>
            <div className="chips" style={{ marginTop: 10 }}>
              {CANDIDATES.map((c, i) => <span key={c.word} className="chip" style={{ background: c.color }}>{c.word}<small>{Math.round(probs[i] * 100)}%</small></span>)}
            </div>
            {tuned && (
              <div className="callout enter" style={{ marginTop: 12 }}><span className="em">🎉</span>
                <div>You just did <b>training by hand</b>! Real training does exactly this for billions of knobs at once, nudging each one a tiny bit after every guess.</div>
              </div>
            )}
          </>,
          canNext: tuned,
          lockedHint: '🎛️ Make “star” the biggest first',
          next: 'Easy vs. hard questions',
        },
        {
          title: '⚖️ Easy or hard: same trip',
          body: <>
            <p>Does Toki work harder on a hard question? Send both through and watch the layers 👉</p>
            <div className="btn-row">
              {QUESTIONS.map((q) => (
                <button key={q.id} className={`btn small ${current.id === q.id && pulse > 0 ? 'sky' : 'ghost'}`} onClick={() => ask(q)}>
                  {asked.includes(q.id) ? '✅ ' : ''}{q.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>{counter}</div>
            {asked.length === QUESTIONS.length && (
              <div className="callout enter" style={{ marginTop: 12 }}><span className="em">🥤</span>
                <Explain
                  kid={<div>Same layers, same amount of maths, <b>no matter how hard</b> the question is! So each bead Toki writes gets only a <b>small, fixed cup of thinking</b>. Remember that cup: it matters a lot later.</div>}
                  curious={<div>Every token costs one forward pass through the same layers: a <b>fixed amount of compute per token</b>, whatever the difficulty. Hard problems need their work spread over many tokens.</div>}
                />
              </div>
            )}
          </>,
          canNext: asked.length === QUESTIONS.length,
          lockedHint: '👆 Try both questions',
          next: 'Is it like a brain?',
        },
        {
          title: '🧠 A brain? Not quite',
          body: <>
            <Explain
              kid={<>
                <p>People say “neurons”, but Toki's are <b>way simpler</b> than the ones in your head. And the maths has <b>no memory</b>: beads go in, chances come out, and nothing is kept. Each new bead starts the whole climb again from the bottom.</p>
                <p>Toki can also only look at so many beads at once. If a chat gets too long, the oldest beads fall out of its window.</p>
              </>}
              curious={<>
                <p>The network is a fixed, <b>stateless</b> function from tokens to probabilities. Its “neurons” are tiny compared with biological ones, which are complex processes with their own memory.</p>
                <p>The input is capped at a <b>maximum context length</b> (thousands to millions of tokens, depending on the model); anything beyond it simply isn't seen.</p>
              </>}
            />
          </>,
        },
      ]}
      play={<Stage hint="Beads in at the bottom · chances out at the top" camera={{ position: [0, 0, 9] }}>
        <LayerStack pulse={pulse} beads={current.beads} probs={probs} onLayer={setLayer} />
      </Stage>}
    />
  )
}
