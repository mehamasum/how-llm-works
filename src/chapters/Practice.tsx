import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { useApp } from '../store'
import { blip } from '../sound'
import { party } from '../ui/confetti'

// Four ways Toki might try a practice problem, and how often each one gets it right.
const STYLES = [
  { id: 'blurt', emoji: '💨', name: 'Blurt it out', color: '#ff6fae', good: 0.15 },
  { id: 'guess', emoji: '🎲', name: 'Wild guess', color: '#ff8c42', good: 0.05 },
  { id: 'steps', emoji: '🪜', name: 'Step by step', color: '#4cc9f0', good: 0.6 },
  { id: 'check', emoji: '🔍', name: 'Steps + double-check', color: '#3ddc97', good: 0.9 },
]
const N = 20

type Attempt = { style: number; ok: boolean }

function pickStyle(w: number[]) {
  const total = w.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i }
  return w.length - 1
}

function Tries({ attempts, reveal }: { attempts: Attempt[]; reveal: number }) {
  const vw = useThree((s) => s.viewport.width)
  const cols = vw < 6 ? 4 : vw < 9 ? 5 : 10
  const rows = Math.ceil(N / cols)
  const gap = 1.05
  const scale = Math.min(1, (vw - 0.5) / (cols * gap), 4.6 / (rows * gap))
  return (
    <group scale={scale}>
      <Sprinkles count={20} />
      {Array.from({ length: N }, (_, i) => {
        const a = attempts[i]
        const c = i % cols, r = Math.floor(i / cols)
        return <Try key={i} a={a} shown={i < reveal} position={[(c - (cols - 1) / 2) * gap, ((rows - 1) / 2 - r) * gap, 0]} i={i} />
      })}
    </group>
  )
}

function Try({ a, shown, position, i }: { a?: Attempt; shown: boolean; position: [number, number, number]; i: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!g.current) return
    const ok = shown && a?.ok
    const bad = shown && a && !a.ok
    const ty = position[1] + (ok ? 0.12 + Math.sin(clock.elapsedTime * 4 + i) * 0.06 : bad ? -0.1 : 0)
    g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, ty, 0.15)
    g.current.rotation.y = ok ? clock.elapsedTime * 2 : THREE.MathUtils.lerp(g.current.rotation.y, 0, 0.1)
    const s = shown ? (ok ? 1.1 : 0.8) : 0.7
    g.current.scale.setScalar(THREE.MathUtils.lerp(g.current.scale.x, s, 0.15))
  })
  const color = !a ? '#d9d2ea' : STYLES[a.style].color
  return (
    <group ref={g} position={position}>
      <RoundedBox args={[0.75, 0.75, 0.75]} radius={0.22}>
        <meshStandardMaterial color={color} roughness={0.3} emissive={shown && a?.ok ? '#3ddc97' : '#000'} emissiveIntensity={shown && a?.ok ? 0.5 : 0} transparent opacity={shown && a && !a.ok ? 0.45 : 1} />
      </RoundedBox>
      {shown && a && (
        a.ok ? (
          <mesh position={[0, 0, 0.42]} rotation={[0, 0, -0.6]}>
            <torusGeometry args={[0.2, 0.06, 8, 16, Math.PI * 0.9]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ) : (
          <group position={[0, 0, 0.42]}>
            <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.45, 0.09, 0.05]} /><meshStandardMaterial color="#ff5a5f" /></mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}><boxGeometry args={[0.45, 0.09, 0.05]} /><meshStandardMaterial color="#ff5a5f" /></mesh>
          </group>
        )
      )}
    </group>
  )
}

export default function Practice() {
  const earn = useApp((s) => s.earn)
  const [weights, setWeights] = useState([1, 1, 1, 1])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [reveal, setReveal] = useState(0)
  const [round, setRound] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const [busy, setBusy] = useState(false)

  const practise = () => {
    if (busy) return
    setBusy(true)
    const at = Array.from({ length: N }, () => {
      const style = pickStyle(weights)
      return { style, ok: Math.random() < STYLES[style].good }
    })
    setAttempts(at)
    setReveal(0)
    let i = 0
    const id = setInterval(() => {
      i++
      setReveal(i)
      blip(at[i - 1]?.ok ? 'pop' : 'tick')
      if (i >= N) {
        clearInterval(id)
        // Reinforce: the ways of thinking that led to right answers become more likely.
        const next = weights.map((w, s) => w * (1 + 0.35 * at.filter((a) => a.style === s && a.ok).length))
        const total = next.reduce((a, b) => a + b, 0)
        setWeights(next.map((w) => (w / total) * 4))
        const score = at.filter((a) => a.ok).length
        setHistory((h) => [...h, score])
        setRound((r) => r + 1)
        setBusy(false)
        if (round + 1 === 4) { earn('practice'); party() }
      }
    }, 90)
  }
  const reset = () => { setWeights([1, 1, 1, 1]); setAttempts([]); setReveal(0); setRound(0); setHistory([]) }
  const total = weights.reduce((a, b) => a + b, 0)

  return (
    <Chapter num={10} title="Practice Makes Better" sub="Reinforcement learning: try, check, repeat"
      story={<>
        <div className="card">
          <Explain
            kid={<>
              <p>Think about a school book 📘. It has <b>explanations</b> (that's the internet reading), <b>worked examples</b> (that's the practice chats)… and <b>practice problems</b>!</p>
              <p>In this last stage, Toki tries the same problem <b>lots of times</b>, in different ways. The ways that got the <b>right answer</b> get a gold star ⭐ and Toki does them more. Nobody tells Toki <i>how</i> to think: it figures that out itself!</p>
            </>}
            curious={<>
              <p><b>Reinforcement learning (RL)</b>: for problems with checkable answers (math, code), the model samples many solutions, and the token sequences that reach correct answers are reinforced.</p>
              <p>Models like DeepSeek-R1 and OpenAI's o-series learned this way and developed long “thinking” on their own: re-checking, trying other approaches, saying “wait…”. Just as AlphaGo found the surprising <b>Move 37</b>, RL can discover strategies no human demonstrated.</p>
            </>}
          />
        </div>
        <div className="card tilt-l">
          <h3>🏋️ Practice round {round + 1}</h3>
          <p className="muted">Toki tries a math problem 20 times. Each colour is a different way of thinking.</p>
          <div className="btn-row">
            <button className="btn mint" onClick={practise} disabled={busy}>▶ Practise 20 times</button>
            <button className="btn ghost small" onClick={reset} disabled={busy}>↺ Start over</button>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {STYLES.map((s, i) => (
              <div key={s.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '.95rem' }}>
                  <span>{s.emoji} {s.name}</span><span>{Math.round((weights[i] / total) * 100)}% of tries</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(weights[i] / total) * 100}%`, background: s.color }} /></div>
              </div>
            ))}
          </div>
          {history.length > 0 && (
            <p style={{ marginTop: 12 }}>✅ Right answers per round: {history.map((h, i) => <span key={i} className="tag" style={{ marginRight: 4 }}>{h}/20</span>)}</p>
          )}
          {round >= 3 && (
            <div className="callout enter"><span className="em">🤯</span><div>See that? Toki taught <b>itself</b> to double-check its work, because that's what keeps winning. Real “thinking” models discovered the same trick!</div></div>
          )}
        </div>
        <div className="bubble toki" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.9rem' }}>
          <b>🤖 thinking…</b> 3 apples + 2 oranges = $13. Oranges are 2 × $2 = $4. So apples are $9, and each one is $3. <b>Wait, let me double-check:</b> 3 × $3 + $4 = $13. ✅ Yes!
        </div>
      </>}
      play={<Stage hint={busy ? 'Trying…' : 'Glowing = right answer ⭐'} camera={{ position: [0, 0, 8] }}>
        <Tries attempts={attempts} reveal={reveal} />
      </Stage>}
    />
  )
}
