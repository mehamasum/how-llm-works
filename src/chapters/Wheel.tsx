import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { useFit } from '../three/useFit'
import { colorFor } from '../ui/colors'
import { useApp } from '../store'
import { join, resolveOther, sampleFrom, wheelSlices, type Choice } from '../model/storyModel'
import { blip } from '../sound'
import { party } from '../ui/confetti'

const R = 2.3

function Wedge({ start, len, color }: { start: number; len: number; color: string }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.absarc(0, 0, R, start, start + len, false)
    s.lineTo(0, 0)
    return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, curveSegments: Math.max(4, Math.ceil(len * 20)) })
  }, [start, len])
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.35} />
    </mesh>
  )
}

type Spin = { from: number; to: number; t0: number; dur: number; choice: Choice }

function WheelScene({ slices, spin, onDone }: { slices: Choice[]; spin: Spin | null; onDone: () => void }) {
  const s = useFit(6.2, 6.4)
  const wheel = useRef<THREE.Group>(null)
  const angle = useRef(0)
  const ticker = useRef<THREE.Group>(null)
  const lastTick = useRef(0)
  const doneFor = useRef<Spin | null>(null)

  const wedges = useMemo(() => {
    let a = 0
    return slices.map((c, i) => {
      const len = Math.max(0.0001, c.p * Math.PI * 2)
      const w = { ...c, start: a, len, color: c.word === '…other' ? '#d9d2ea' : colorFor(i) }
      a += len
      return w
    })
  }, [slices])

  useFrame(({ clock }) => {
    if (spin) {
      const t = Math.min(1, (clock.elapsedTime * 1000 - spin.t0) / spin.dur)
      const ease = 1 - Math.pow(1 - t, 4)
      angle.current = spin.from + (spin.to - spin.from) * ease
      // tick the pointer every time a slice edge passes
      const step = Math.floor(angle.current / 0.35)
      if (step !== lastTick.current) { lastTick.current = step; blip('tick'); if (ticker.current) ticker.current.rotation.z = 0.35 }
      if (t >= 1 && doneFor.current !== spin) { doneFor.current = spin; onDone() }
    }
    if (wheel.current) wheel.current.rotation.z = angle.current
    if (ticker.current) ticker.current.rotation.z = THREE.MathUtils.lerp(ticker.current.rotation.z, 0, 0.2)
  })

  return (
    <group scale={s}>
      <Sprinkles count={28} />
      <group ref={wheel}>
        {wedges.map((w, i) => <Wedge key={`${w.word}-${i}`} start={w.start} len={w.len} color={w.color} />)}
        {wedges.map((w, i) => {
          const mid = w.start + w.len / 2
          return w.len > 0.22 ? (
            <Html key={`l-${w.word}-${i}`} position={[Math.cos(mid) * R * 0.66, Math.sin(mid) * R * 0.66, 0.45]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 14, color: '#2b2140', background: 'rgba(255,255,255,.88)', borderRadius: 999, padding: '1px 8px', whiteSpace: 'nowrap' }}>
                {w.word} <span style={{ opacity: 0.6, fontSize: 11 }}>{Math.round(w.p * 100)}%</span>
              </div>
            </Html>
          ) : null
        })}
        <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.2, 24]} />
          <meshStandardMaterial color="#ffc93c" metalness={0.3} roughness={0.2} />
        </mesh>
      </group>
      <mesh position={[0, 0, -0.1]}>
        <torusGeometry args={[R + 0.12, 0.14, 12, 80]} />
        <meshStandardMaterial color="#2b2140" />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * (R + 0.12), Math.sin(a) * (R + 0.12), 0.1]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#fff6e5" emissive="#ffc93c" emissiveIntensity={0.8} />
          </mesh>
        )
      })}
      <group ref={ticker} position={[0, R + 0.35, 0.35]}>
        <mesh rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.25, 0.55, 3]} />
          <meshStandardMaterial color="#ff5a5f" />
        </mesh>
      </group>
    </group>
  )
}

const STARTS = ['once upon a time there was a', 'the cat', 'mia built a', 'the little robot', 'i like to']

export default function Wheel() {
  const earn = useApp((s) => s.earn)
  const [start, setStart] = useState(STARTS[0])
  const [words, setWords] = useState<string[]>([])
  const [temp, setTemp] = useState(1)
  const [spin, setSpin] = useState<Spin | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [stories, setStories] = useState<string[]>([])
  const angleBase = useRef(0)

  const context = join([start, ...words])
  const slices = useMemo(() => wheelSlices(context, temp), [context, temp])
  const spun = words.length

  const pickWord = (c: Choice) => (c.word === '…other' ? resolveOther(context, temp) : c.word)

  const doSpin = () => {
    if (spinning) return
    const choice = sampleFrom(slices)
    // find where that slice sits on the wheel and aim the pointer (at the top) inside it
    let a = 0
    for (const c of slices) { if (c === choice) break; a += c.p * Math.PI * 2 }
    const mid = a + choice.p * Math.PI * (0.3 + Math.random() * 1.4)
    const from = angleBase.current
    let to = Math.PI / 2 - mid
    while (to < from + Math.PI * 6) to += Math.PI * 2
    angleBase.current = to % (Math.PI * 2)
    setSpinning(true)
    setSpin({ from: from, to, t0: performance.now(), dur: 2600, choice })
  }

  const onDone = () => {
    if (!spin) return
    const w = pickWord(spin.choice)
    setWords((ws) => [...ws, w])
    setSpinning(false)
    blip('pop')
    if (spun + 1 === 5) { earn('wheel'); party({ y: 0.4 }) }
  }

  const quick = () => {
    const ws = [...words]
    for (let i = 0; i < 12; i++) {
      const ctx = join([start, ...ws])
      const sl = wheelSlices(ctx, temp)
      const c = sampleFrom(sl)
      ws.push(c.word === '…other' ? resolveOther(ctx, temp) : c.word)
      if (c.word === '.' && i > 4) break
    }
    setWords(ws)
    blip('pop')
    earn('wheel')
  }

  const restart = (s = start) => {
    if (words.length) setStories((st) => [join([start, ...words]), ...st].slice(0, 4))
    setStart(s)
    setWords([])
    setSpin(null)
    setSpinning(false)
  }

  return (
    <Chapter num={4} title="Spin the Word Wheel" sub="How Toki picks every single word"
      story={<>
        <div className="card">
          <Explain
            kid={<>
              <p>When Toki answers you, it doesn't know the whole answer ahead of time! For each next piece, it builds a <b>wheel of chances</b> 🎡 and <b>spins</b> it.</p>
              <p>The word that wins gets added on, and then Toki spins <i>again</i>. One bead at a time, until the answer is done.</p>
            </>}
            curious={<>
              <p>This is <b>inference</b>. The trained model outputs a probability distribution over the next token; we <b>sample</b> one, append it to the context, and repeat. It's a coin-flip-y process, which is why the same question can get different answers.</p>
              <p><b>Temperature</b> reshapes the distribution: low temperature favours the top choice, high temperature flattens it so unlikely tokens get picked more often.</p>
            </>}
          />
        </div>
        <div className="card tilt-l">
          <h3>📖 Toki's story so far</h3>
          <div className="bubble toki" style={{ fontSize: '1.15rem', minHeight: 70 }}>
            <span className="muted">{start}</span>{' '}
            {words.map((w, i) => <b key={i} className="enter" style={{ color: colorFor(i), textShadow: '0 1px 0 #2b214055' }}>{w} </b>)}
            {spinning && <span className="typing" />}
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button className="btn tangerine" onClick={doSpin} disabled={spinning}>🎡 Spin!</button>
            <button className="btn ghost small" onClick={quick} disabled={spinning}>⚡ Spin 12 fast</button>
            <button className="btn ghost small" onClick={() => restart()} disabled={spinning}>↺ Same start, new story</button>
          </div>
          <div style={{ marginTop: 14 }}>
            <label htmlFor="temp"><b>Wildness (temperature):</b> {temp < 0.6 ? '🧊 careful' : temp > 1.4 ? '🌶️ wild!' : '🙂 normal'}</label>
            <input id="temp" type="range" min={0.2} max={2.2} step={0.1} value={temp} onChange={(e) => setTemp(+e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)', height: 32 }} />
          </div>
          <p className="muted" style={{ marginBottom: 6 }}>Pick a new beginning:</p>
          <div className="btn-row">{STARTS.map((s) => <button key={s} className="btn ghost small" onClick={() => restart(s)}>{s}…</button>)}</div>
        </div>
        {stories.length > 0 && (
          <div className="card tilt-r">
            <h3>🎲 Earlier stories</h3>
            <p className="muted">Same model, different spins, different stories!</p>
            {stories.map((s, i) => <div key={i} className="bubble" style={{ marginTop: 8 }}>{s}</div>)}
          </div>
        )}
        <p className="muted" style={{ fontSize: '.9rem' }}>This wheel comes from a tiny word-counting model trained on our little story book. Real chatbots do the same thing with 200,000 slices!</p>
      </>}
      play={<Stage hint={spinning ? 'Round and round…' : 'Bigger slice = more likely'} camera={{ position: [0, 0, 8] }}>
        <WheelScene slices={slices} spin={spin} onDone={onDone} />
      </Stage>}
    />
  )
}
