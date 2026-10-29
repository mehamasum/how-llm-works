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
    const row = Math.floor(i / 6), col = i % 6
    const x = (row % 2 ? 5 - col : col) - 2.5
    return new THREE.Vector3(x * width * 0.155, 1.0 - row * 2.2 + Math.sin(i) * 0.25, 0)
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
      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card tilt-l">
          <h3>🧩 The recipe</h3>
          <ol style={{ paddingLeft: 22, margin: 0 }}>
            <li><b>Read the internet</b> and chop it into token beads.</li>
            <li><b>Play the guessing game</b> billions of times → a page dreamer.</li>
            <li><b>Practise example chats</b> → a helpful assistant.</li>
            <li><b>Practise problems</b> and learn from thumbs 👍 → better thinking.</li>
          </ol>
        </div>
        <div className="card tilt-r">
          <h3>🤖 So what is it?</h3>
          <Explain
            kid={<p>A chatbot is a giant <b>guess-the-next-bead machine</b> that learned to sound like a kind, helpful person. It's amazing, but it can make things up, so <b>double-check important stuff</b> and use it as a helper, not a boss!</p>}
            curious={<p>You're talking to a neural network that <b>simulates a helpful labeler</b>, built on a lossy compression of the internet and sharpened by reinforcement learning. Treat it as a powerful tool with jagged edges: verify facts, give it the right context, and use tools for math and lookups.</p>}
          />
        </div>
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
        <p className="muted" style={{ marginTop: 10 }}>Remember your sentence? <b>“{sentence}”</b> Now you know every step it goes through. 🎉</p>
        <button className="btn pink" onClick={() => { party(); blip('ding') }}>🎉 Celebrate!</button>
      </div>
    </article>
  )
}
