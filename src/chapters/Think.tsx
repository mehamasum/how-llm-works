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

  const problem = <div className="bubble user">Emily buys <b>3 apples</b> and <b>2 oranges</b>. Each orange costs <b>$2</b>. The total is <b>$13</b>. How much is each apple?</div>
  const answer = (
    <>
      <div className="bubble toki">
        {steps.slice(0, upTo).map((s) => s.w).join(' ')}
        {upTo < steps.length && <span className="typing" />}
      </div>
      <button className="btn small ghost" style={{ marginTop: 10 }} onClick={() => setRun((r) => r + 1)}>↺ Replay</button>
    </>
  )

  return (
    <Chapter title="Tokens to Think" sub="Why “show your work” really helps AI"
      onStep={(s) => { if (s === 1) setStyle('first'); if (s === 2) setStyle('steps') }}
      steps={[
        {
          title: '🥤 One small cup of thinking per bead',
          body: <Explain
            kid={<>
              <p>Here's a strange fact: Toki can only do a <b>small cup of thinking</b> for each bead it writes. Every bead gets the <b>same size cup</b>. See the cups in the box?</p>
              <p>So when a helper writes a practice answer, <i>how</i> they write it really matters. Let's compare two answers to the same problem.</p>
            </>}
            curious={<p>Each token is produced by one pass through the network: a fixed, limited amount of computation. A model can't do a lot of reasoning “in its head” for a single token.</p>}
          />,
          next: 'Compare two answers',
        },
        {
          title: '😬 Answer A: blurt it out',
          body: <>
            {problem}
            <p style={{ marginTop: 10 }}><b>Practice answer A</b> gives the answer right away:</p>
            {answer}
            {upTo >= steps.length && style === 'first' && (
              <div className="callout enter" style={{ marginTop: 10 }}><span className="em">💦</span>
                <div>Both answers say $3, but in answer A the <b>$3</b> bead had to do <b>all</b> the math at once, and its cup overflowed! If Toki copies answers like this, it learns to guess in one go.</div></div>
            )}
          </>,
          next: 'Now answer B',
        },
        {
          title: '😎 Answer B: step by step',
          body: <>
            {problem}
            <p style={{ marginTop: 10 }}><b>Practice answer B</b> works it out step by step:</p>
            {answer}
            {upTo >= steps.length && style === 'steps' && (
              <div className="callout enter" style={{ marginTop: 10 }}><span className="em">🎉</span>
                <div>Every bead did just a little bit of work. No spills! Answer B is the better one to practise on, and it's why chatbots often “think out loud”.</div></div>
            )}
          </>,
          next: 'One more tip',
        },
        {
          title: '🧮 Give Toki a calculator',
          body: <Explain
            kid={<p>Toki is also not great at counting or big math in its head. For those, ask the chatbot to <b>use code</b>. It's like giving Toki a calculator!</p>}
            curious={<p>Models are bad at mental arithmetic and counting, so good answers spread reasoning across tokens, and asking them to <b>use code</b> (a tool) is often more reliable.</p>}
          />,
        },
      ]}
      play={<Stage hint="Each cup = thinking for one bead" camera={{ position: [0, 2.6, 7.6] }}>
        <Cups steps={steps} upTo={upTo} />
      </Stage>}
    />
  )
}
