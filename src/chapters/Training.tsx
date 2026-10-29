import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { Toki } from '../three/Toki'
import { useFit } from '../three/useFit'
import { useApp } from '../store'
import { party } from '../ui/confetti'
import { blip } from '../sound'

const QUIZ = [
  { text: 'Once upon a ___', options: ['time', 'banana', 'jump'], answer: 'time' },
  { text: 'The cat liked to sleep in the ___', options: ['rocket', 'sun', 'sing'], answer: 'sun' },
  { text: 'Mia built a rocket out of boxes and ___', options: ['tape', 'happy', 'swim'], answer: 'tape' },
  { text: 'Twinkle, twinkle, little ___', options: ['car', 'star', 'soup'], answer: 'star' },
]

function GuessGame() {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const q = QUIZ[i]
  if (!q) {
    return (
      <div className="enter">
        <p className="big-num">{score} / {QUIZ.length} 🎯</p>
        <p>You're a next-word guesser! Toki plays <b>this exact game</b>, billions of times, on all of that internet text.</p>
        <button className="btn small ghost" onClick={() => { setI(0); setScore(0) }}>Play again</button>
      </div>
    )
  }
  const pick = (o: string) => {
    if (picked) return
    setPicked(o)
    if (o === q.answer) { setScore((s) => s + 1); blip('pop') } else blip('boop')
  }
  return (
    <>
      <p className="muted">Round {i + 1} of {QUIZ.length}: what comes next?</p>
      <div className="bubble" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
        {q.text.replace('___', '')}<span style={{ color: 'var(--accent)' }}>{picked ? picked : '___'}</span>
      </div>
      <div className="btn-row" style={{ marginTop: 10 }}>
        {q.options.map((o) => (
          <button key={o} className={`btn small ${picked ? (o === q.answer ? 'mint' : o === picked ? 'pink' : 'ghost') : 'ghost'}`} onClick={() => pick(o)}>{o}</button>
        ))}
        {picked && <button className="btn small" onClick={() => { setPicked(null); setI(i + 1) }}>Next ▶</button>}
      </div>
    </>
  )
}

type Progress = { step: number; loss: number; sample: string | null; knobs: number[]; done: boolean }

function Knobs({ knobs, quality }: { knobs: number[]; quality: number }) {
  const s = useFit(8, 8.2)
  const cols = 8
  return (
    <group scale={s}>
      <Sprinkles count={20} />
      <Toki position={[0, 2.7, 0.2]} scale={0.55} mood={quality > 0.7 ? 'happy' : quality > 0.05 ? 'think' : 'sleepy'} />
      <RoundedBox args={[cols * 0.8 + 0.4, 6 * 0.8 + 0.4, 0.3]} radius={0.25} position={[0, -0.75, -0.25]}>
        <meshStandardMaterial color="#2b2140" emissive="#9b5de5" emissiveIntensity={quality * 0.5} />
      </RoundedBox>
      {knobs.map((k, i) => {
        const x = (i % cols - (cols - 1) / 2) * 0.8
        const y = -0.75 + (2.5 - Math.floor(i / cols)) * 0.8
        return (
          <group key={i} position={[x, y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.28, 0.32, 0.25, 20]} />
              <meshStandardMaterial color={k >= 0 ? '#4cc9f0' : '#ff6fae'} roughness={0.3} />
            </mesh>
            <KnobPointer value={k} />
          </group>
        )
      })}
    </group>
  )
}

function KnobPointer({ value }: { value: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, -value * 4, 0.15)
  })
  return (
    <group ref={ref} position={[0, 0, 0.14]}>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.07, 0.24, 0.05]} />
        <meshStandardMaterial color="#fff6e5" />
      </mesh>
    </group>
  )
}

function LossChart({ points, start }: { points: { step: number; loss: number }[]; start: number }) {
  const W = 320, H = 130, max = Math.max(start, ...points.map((p) => p.loss)), maxStep = 1500
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${(p.step / maxStep) * W},${H - (p.loss / max) * (H - 10)}`).join(' ')
  return (
    <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} width="100%" role="img" aria-label="Loss going down as the model trains">
      <rect x="-4" y="-4" width={W + 8} height={H + 8} rx="14" fill="var(--bg-2)" stroke="var(--line)" strokeWidth="2.5" />
      {points.length > 1 && <path d={d} fill="none" stroke="var(--pink)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
      <text x="8" y="16" fontSize="12" fontWeight="800" fill="var(--ink-soft)">surprise (loss)</text>
      <text x={W - 8} y={H - 6} fontSize="12" fontWeight="800" textAnchor="end" fill="var(--ink-soft)">practice steps →</text>
    </svg>
  )
}

export default function Training() {
  const earn = useApp((s) => s.earn)
  const worker = useRef<Worker | null>(null)
  const [info, setInfo] = useState<{ params: number; loss: number } | null>(null)
  const [p, setP] = useState<Progress | null>(null)
  const [points, setPoints] = useState<{ step: number; loss: number }[]>([])
  const [samples, setSamples] = useState<{ step: number; text: string }[]>([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const w = new Worker(new URL('../model/charTrainer.worker.ts', import.meta.url), { type: 'module' })
    worker.current = w
    w.onmessage = (e) => {
      const m = e.data
      if (m.type === 'ready') {
        setInfo({ params: m.params, loss: m.loss })
        setP({ step: 0, loss: m.loss, sample: m.sample, knobs: m.knobs, done: false })
        setSamples([{ step: 0, text: m.sample }])
      } else {
        setP(m)
        // smooth the noisy per-batch loss so the trend is easy to see
        setPoints((ps) => [...ps, { step: m.step, loss: ps.length ? ps[ps.length - 1].loss * 0.8 + m.loss * 0.2 : m.loss }])
        // keep the newest few samples, plus the very first gibberish one for comparison
        if (m.sample) setSamples((ss) => (ss.length ? [{ step: m.step, text: m.sample }, ...ss.slice(0, -1).slice(0, 3), ss[ss.length - 1]] : [{ step: m.step, text: m.sample }]))
        if (m.done) { setRunning(false); earn('training'); party() }
      }
    }
    return () => w.terminate()
  }, [earn])

  const start = () => { blip('pop'); setRunning(true); worker.current?.postMessage({ type: 'start', steps: 1500 }) }
  const pause = () => { setRunning(false); worker.current?.postMessage({ type: 'stop' }) }
  const reset = () => { setRunning(false); setPoints([]); setSamples([]); worker.current?.postMessage({ type: 'reset' }) }
  const quality = p && info ? Math.max(0, 1 - p.loss / info.loss) : 0

  return (
    <Chapter num={3} title="The Guessing Game" sub="Training = guessing the next piece, over and over"
      story={<>
        <div className="card">
          <Explain
            kid={<>
              <p>Here's the big secret: Toki learns by playing <b>one game</b> — <i>“guess the next piece of text!”</i></p>
              <p>Every time Toki guesses wrong, it twists its <b>knobs</b> 🎛️ a tiny bit so the right answer becomes more likely next time. Do that billions of times and Toki gets really good!</p>
            </>}
            curious={<>
              <p>A neural network takes a window of tokens (the <b>context</b>) and outputs a probability for every possible next token. The <b>loss</b> measures how surprised it was by the real next token.</p>
              <p>Training nudges all the <b>parameters</b> (the knobs) slightly downhill on the loss, batch after batch. Big models do this on ~15 trillion tokens with hundreds of billions of parameters, for months, on thousands of GPUs.</p>
            </>}
          />
        </div>
        <div className="card tilt-l"><h3>🎯 You try first!</h3><GuessGame /></div>
        <div className="card tilt-r">
          <h3>🧪 Now watch a real baby AI learn</h3>
          <p className="muted">This tiny network reads 6 letters and guesses the 7th. It has <b>{info ? info.params.toLocaleString() : '…'}</b> knobs and trains right here in your browser on a few little stories.</p>
          <div className="btn-row">
            {p?.done ? <span className="sticker" style={{ background: 'var(--mint)' }}>✓ Trained!</span> : !running ? <button className="btn mint" onClick={start} disabled={!info}>{p && p.step > 0 ? '▶ Keep training' : '▶ Start training'}</button>
              : <button className="btn" onClick={pause}>⏸ Pause</button>}
            <button className="btn ghost small" onClick={reset}>↺ Reset</button>
            <span className="tag">step {p?.step ?? 0} / 1500</span>
          </div>
          <div style={{ marginTop: 12 }}><LossChart points={points} start={info?.loss ?? 3.4} /></div>
          <h4 style={{ marginTop: 12 }}>What it writes 👇</h4>
          <div style={{ display: 'grid', gap: 8 }}>
            {samples.map((s) => (
              <div key={s.step} className="bubble toki enter" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.9rem' }}>
                <span className="tag">step {s.step}</span> {s.text}
              </div>
            ))}
          </div>
        </div>
      </>}
      play={<>
        <Stage hint={running ? 'Knobs turning…' : 'Each knob is a real number inside the network'} camera={{ position: [0, 0.2, 9.5] }}>
          <Knobs knobs={p?.knobs ?? Array(48).fill(0)} quality={quality} />
        </Stage>
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}><span>🧠 Smartness</span><span>{Math.round(quality * 100)}%</span></div>
          <div className="bar-track" style={{ marginTop: 6 }}><div className="bar-fill" style={{ width: `${quality * 100}%` }} /></div>
          <p className="muted" style={{ margin: '8px 0 0', fontSize: '.9rem' }}>A real chatbot has about <b>a trillion</b> knobs. Counting one knob per second would take over 30,000 years!</p>
        </div>
      </>}
    />
  )
}
