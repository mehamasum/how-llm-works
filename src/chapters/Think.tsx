import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { useApp } from '../store'
import { blip } from '../sound'
import { party } from '../ui/confetti'

// Each word is one token, and "work" is how much thinking that token needs (1 = a full cup).
type Step = { w: string; work: number }
const ANSWER_FIRST: Step[] = [
  { w: 'The', work: 0.1 }, { w: 'answer', work: 0.1 }, { w: 'is', work: 0.1 }, { w: '$3', work: 3.2 },
  { w: '.', work: 0.05 }, { w: 'Because', work: 0.1 }, { w: '2×$2', work: 0.4 }, { w: '=$4', work: 0.4 }, { w: '…', work: 0.1 },
]
const STEP_BY_STEP: Step[] = [
  { w: 'Oranges:', work: 0.2 }, { w: '2×$2', work: 0.5 }, { w: '=$4', work: 0.6 }, { w: '.', work: 0.05 },
  { w: '$13−$4', work: 0.5 }, { w: '=$9', work: 0.6 }, { w: '.', work: 0.05 }, { w: '$9÷3', work: 0.5 }, { w: '=$3', work: 0.6 },
]

function Cups({ steps, upTo }: { steps: Step[]; upTo: number }) {
  const vw = useThree((s) => s.viewport.width)
  const perRow = vw < 7 ? 3 : 5
  const rows = Math.ceil(steps.length / perRow)
  const gap = 1.25
  return (
    <group scale={Math.min(1.3, vw / (perRow * gap + 0.6))}>
      <Sprinkles count={20} />
      {steps.map((s, i) => {
        const r = Math.floor(i / perRow), c = i % perRow
        const n = Math.min(perRow, steps.length - r * perRow)
        return <Cup key={`${s.w}-${i}`} step={s} active={i < upTo} current={i === upTo - 1} position={[(c - (n - 1) / 2) * gap, ((rows - 1) / 2 - r) * 2.1, 0]} />
      })}
    </group>
  )
}

function Cup({ step, active, current, position }: { step: Step; active: boolean; current: boolean; position: [number, number, number] }) {
  const fill = useRef<THREE.Mesh>(null)
  const g = useRef<THREE.Group>(null)
  const drips = useRef<THREE.Group>(null)
  const over = step.work > 1
  useFrame(({ clock }, dt) => {
    const target = active ? Math.min(1, step.work) : 0.001
    if (fill.current) {
      const s = THREE.MathUtils.lerp(fill.current.scale.y, target, Math.min(1, dt * 4))
      fill.current.scale.y = s
      fill.current.position.y = -0.45 + s * 0.45
    }
    if (g.current) {
      g.current.rotation.z = active && over ? Math.sin(clock.elapsedTime * 25) * 0.08 : 0
      g.current.position.y = position[1] + (current ? 0.15 : 0)
    }
    if (drips.current) {
      drips.current.visible = active && over
      drips.current.children.forEach((d, i) => {
        const t = (clock.elapsedTime * 1.4 + i / 6) % 1
        const a = (i / 6) * Math.PI * 2
        d.position.set(Math.cos(a) * (0.35 + t * 0.6), 0.5 + t * 0.4 - t * t * 1.8, Math.sin(a) * 0.3)
      })
    }
  })
  const color = active ? (over ? '#ff5a5f' : '#3ddc97') : '#ccc'
  return (
    <group ref={g} position={position}>
      <mesh>
        <cylinderGeometry args={[0.42, 0.34, 0.95, 24, 1, true]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={fill} scale={[1, 0.001, 1]}>
        <cylinderGeometry args={[0.38, 0.32, 0.9, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.04, 8, 32]} />
        <meshStandardMaterial color="#2b2140" />
      </mesh>
      <group ref={drips} visible={false}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i}><sphereGeometry args={[0.08, 10, 10]} /><meshStandardMaterial color="#ff5a5f" /></mesh>
        ))}
      </group>
      <Html position={[0, -0.8, 0]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', background: active ? '#fff' : 'rgba(255,255,255,.5)', color: '#2b2140', border: '2px solid #2b2140', borderRadius: 10, padding: '0 6px' }}>
          {step.w}
        </div>
      </Html>
    </group>
  )
}

export default function Think() {
  const earn = useApp((s) => s.earn)
  const [style, setStyle] = useState<'first' | 'steps'>('first')
  const [upTo, setUpTo] = useState(0)
  const [run, setRun] = useState(0)
  const steps = style === 'first' ? ANSWER_FIRST : STEP_BY_STEP

  useEffect(() => {
    setUpTo(0)
    let i = 0
    const id = setInterval(() => {
      i++
      setUpTo(i)
      blip('tick')
      if (i >= steps.length) {
        clearInterval(id)
        if (style === 'steps') { earn('think'); party({ y: 0.3 }) }
      }
    }, 450)
    return () => clearInterval(id)
  }, [style, steps.length, earn, run])

  return (
    <Chapter num={8} title="Tokens to Think" sub="Why “show your work” really helps AI"
      story={<>
        <div className="card">
          <Explain
            kid={<>
              <p>Here's a strange fact: Toki can only do a <b>small cup of thinking</b> 🥤 for each bead it writes. Every bead gets the same size cup!</p>
              <p>If Toki tries to blurt out the answer right away, all the hard thinking has to squeeze into <b>one cup</b>, and it spills over 💦. But if it works <b>step by step</b>, the thinking spreads across many cups.</p>
            </>}
            curious={<>
              <p>Each token is produced by one pass through the network: a fixed, limited amount of computation. A model can't do a lot of reasoning “in its head” for a single token.</p>
              <p>So good training answers <b>spread the reasoning across many tokens</b>, writing intermediate results before the final answer. Models are also bad at mental arithmetic and counting, so asking them to <b>use code</b> is often more reliable.</p>
            </>}
          />
        </div>
        <div className="card tilt-l">
          <h3>🍎 The apple problem</h3>
          <div className="bubble user">Emily buys <b>3 apples</b> and <b>2 oranges</b>. Each orange costs <b>$2</b>. The total is <b>$13</b>. How much is each apple?</div>
          <div className="switch" style={{ marginTop: 12 }}>
            <button className={style === 'first' ? 'on' : ''} onClick={() => setStyle('first')}>😬 Answer first</button>
            <button className={style === 'steps' ? 'on' : ''} onClick={() => setStyle('steps')}>😎 Step by step</button>
          </div>
          <div className="bubble toki" style={{ marginTop: 10 }}>
            {steps.slice(0, upTo).map((s) => s.w).join(' ')}
            {upTo < steps.length && <span className="typing" />}
          </div>
          {upTo >= steps.length && (
            <div className="callout enter" style={{ marginTop: 10 }}>
              <span className="em">{style === 'first' ? '💦' : '🎉'}</span>
              <div>{style === 'first'
                ? <>The <b>$3</b> bead had to do <b>all</b> the math at once, and its cup overflowed! Sometimes it works, but it's risky. Try <b>Step by step</b>.</>
                : <>Every bead did just a little bit of work. No spills! This is why AI often “thinks out loud”.</>}
              </div>
            </div>
          )}
          <button className="btn small ghost" style={{ marginTop: 10 }} onClick={() => setRun((r) => r + 1)}>↺ Replay</button>
        </div>
        <div className="callout"><span className="em">🧮</span><div><b>Tip:</b> For counting or big math, ask the chatbot to <b>use code</b>. It's like giving Toki a calculator!</div></div>
      </>}
      play={<Stage hint="Each cup = thinking for one bead" camera={{ position: [0, 2.6, 7.6] }}>
        <Cups steps={steps} upTo={upTo} />
      </Stage>}
    />
  )
}
