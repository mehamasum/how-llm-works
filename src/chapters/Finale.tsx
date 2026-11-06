import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { Toki } from '../three/Toki'
import { Explain } from '../ui/Explain'
import { CHAPTERS } from '.'
import { goToId } from '../nav'
import { useApp } from '../store'
import { party } from '../ui/confetti'
import { blip } from '../sound'

const STOPS = CHAPTERS.slice(1, -1)
type Stop = (typeof STOPS)[number]
const ahead = (c: Stop) => c.part === 'Looking ahead'
const GROUPS = [
  { key: 'past', era: 'past', label: '📼 How Toki was built (months, before you ever chatted)', has: (c: Stop) => c.era === 'past' },
  { key: 'now', era: 'now', label: '🔴 What happens when you press Enter', has: (c: Stop) => c.era === 'now' && !ahead(c) },
  { key: 'ahead', era: 'now', label: '🚀 Looking ahead', has: ahead },
]

function Path({ hover, setHover }: { hover: number; setHover: (i: number) => void }) {
  const { width, height } = useThree((s) => s.viewport)
  const tall = height > width
  // A winding board-game path: snakes downwards on phones, across on wide screens.
  const pts = STOPS.map((_, i) => {
    const n = STOPS.length
    if (tall) {
      const row = Math.floor(i / 3), col = i % 3
      const x = (row % 2 ? 2 - col : col) - 1
      return new THREE.Vector3(x * width * 0.3, height * 0.28 - row * (height * 0.66) / Math.ceil(n / 3 - 1), 0)
    }
    const per = Math.ceil(n / 2)
    const row = Math.floor(i / per), col = i % per
    const x = (row % 2 ? per - 1 - col : col) - (per - 1) / 2
    return new THREE.Vector3(x * width * (0.8 / per), 1.0 - row * 2.2 + Math.sin(i) * 0.25, 0)
  })
  const curve = new THREE.CatmullRomCurve3(pts)
  const toki = useRef<THREE.Group>(null)
  const t = useRef(0)
  useFrame((_, dt) => {
    const target = hover >= 0 ? hover / (STOPS.length - 1) : (t.current + dt * 0.04) % 1
    t.current = hover >= 0 ? THREE.MathUtils.lerp(t.current, target, 0.08) : target
    if (toki.current) {
      const p = curve.getPointAt(Math.min(1, Math.max(0, t.current)))
      toki.current.position.set(p.x, p.y + 0.75 + Math.abs(Math.sin(t.current * 60)) * 0.15, 0.4)
    }
  })
  return (
    <group>
      <Sprinkles count={30} />
      <mesh>
        <tubeGeometry args={[curve, 120, 0.06, 8, false]} />
        <meshStandardMaterial color="#ffc93c" />
      </mesh>
      {STOPS.map((c, i) => (
        <group key={c.id} position={pts[i]}>
          <mesh rotation={[Math.PI / 2.4, 0, 0]}
            onClick={(e) => { e.stopPropagation(); goToId(c.id) }}
            onPointerOver={() => { setHover(i); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { document.body.style.cursor = '' }}>
            <cylinderGeometry args={[0.42, 0.5, 0.25, 32]} />
            <meshStandardMaterial color={c.accent} emissive={c.accent} emissiveIntensity={hover === i ? 0.6 : 0.15} />
          </mesh>
          <Html center position={[0, 0, 0.3]} zIndexRange={[1, 0]} style={{ pointerEvents: 'none', fontSize: 22 }}>{c.emoji}</Html>
        </group>
      ))}
      <group ref={toki} scale={0.32}><Toki mood="happy" /></group>
    </group>
  )
}

export default function Finale() {
  const { stickers, sentence, earn } = useApp()
  useEffect(() => { earn('finale') }, [earn])
  const [hover, setHover] = useState(-1)
  const stop = hover >= 0 ? STOPS[hover] : null

  return (
    <article className="enter">
      <header className="chapter-head">
        <div className="chapter-num">🏆</div>
        <div>
          <h1>The Whole Journey</h1>
          <div className="sub">So… what are you actually talking to?</div>
        </div>
      </header>
      <Stage hint="Tap an island to go back there" camera={{ position: [0, 0, 9] }} height="clamp(340px, 58vh, 560px)">
        <Path hover={hover} setHover={setHover} />
      </Stage>
      <div className="card enter" style={{ marginTop: 14, minHeight: 64 }}>
        {stop ? <p style={{ margin: 0 }}><b>{stop.emoji} {stop.title}</b>: {stop.short}. <button className="btn small sky" onClick={() => goToId(stop.id)}>Go ▶</button></p>
          : <p className="muted" style={{ margin: 0 }}>Hover or tap the islands to retrace the adventure.</p>}
      </div>
      <div className="card story-thread" style={{ marginTop: 18 }}>
        <h2>🧵 The whole story, in {STOPS.length} big ideas</h2>
        <p className="muted">Each chapter answered the question the one before it left open. Put together, this is how a chatbot like ChatGPT works:</p>
        {GROUPS.map((g) => {
          const items = STOPS.filter(g.has)
          const start = STOPS.findIndex(g.has) + 1
          return (
            <section key={g.key}>
              <h3 className={`era-tag ${g.era}`} style={{ fontSize: '1rem', marginTop: 14 }}>{g.label}</h3>
              <ol className="thread" start={start}>
                {items.map((c) => (
                  <li key={c.id}>
                    <button className="thread-item" onClick={() => goToId(c.id)}>
                      <span className="em">{c.emoji}</span>
                      <span>{c.lesson}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )
        })}
      </div>
      <div className="card tilt-l" style={{ marginTop: 18 }}>
        <h3>💬 Your message's journey</h3>
        <div className="journey">
          <span className="bubble user">“{sentence}”</span>
          <span className="arrow">→</span><span className="tag">🍬 chopped into beads</span>
          <span className="arrow">→</span><span className="tag">🙈 joins the hidden beads</span>
          <span className="arrow">→</span><span className="tag">🧱 climbs the frozen layers to build a wheel</span>
          <span className="arrow">→</span><span className="tag">🎡 spin, add a bead, repeat</span>
          <span className="arrow">→</span><span className="tag">💬 Toki's answer</span>
        </div>
      </div>
      <div className="card tilt-r" style={{ marginTop: 18 }}>
        <h3>🤖 So what are you talking to?</h3>
        <Explain
          kid={<p>A giant <b>guess-the-next-bead machine</b>. It read a huge pile of the internet, then practised chats written by kind helpers, then practised problems until it found its own ways to think. It's amazing, but it can make things up and has surprising holes, so <b>double-check important stuff</b> and use it as a helper, not a boss!</p>}
          curious={<p>A neural network that <b>simulates a helpful labeler</b>: a lossy compression of the internet (pre-training), shaped into an assistant (SFT), and sharpened by reinforcement learning. Each token gets a fixed amount of compute, knowledge is a vague recollection unless it's in the context window, and abilities are jagged. Treat it as a powerful tool: verify facts, give it context, and let it use tools for math and lookups.</p>}
        />
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3>⭐ Your sticker book ({stickers.length}/{CHAPTERS.length})</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {CHAPTERS.map((c) => (
            <button key={c.id} title={c.title} onClick={() => goToId(c.id)} className="island" style={{ minHeight: 0, padding: 8, filter: stickers.includes(c.id) ? 'none' : 'grayscale(1)', opacity: stickers.includes(c.id) ? 1 : 0.4 }}>
              <span className="em">{c.emoji}</span>
            </button>
          ))}
        </div>
        <button className="btn pink" onClick={() => { party(); blip('ding') }}>🎉 Celebrate!</button>
      </div>
    </article>
  )
}
