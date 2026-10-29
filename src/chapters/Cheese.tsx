import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { Toki } from '../three/Toki'
import { useFit } from '../three/useFit'
import { colorFor } from '../ui/colors'
import { show } from '../three/BeadRows'
import { useApp } from '../store'
import { useTokenizer } from '../model/tokenizer'
import { blip } from '../sound'
import { party } from '../ui/confetti'

type Hole = { id: string; emoji: string; title: string; q: string; oops: string; why: string; probe: string; fix: string; pos: [number, number] }
const HOLES: Hole[] = [
  {
    id: 'strawberry', emoji: '🍓', title: 'Counting letters', pos: [-2.0, -0.6],
    q: 'How many r’s are in “strawberry”?', oops: 'There are 2 r’s in strawberry.',
    why: 'Toki doesn’t see letters, only beads. And “strawberry” can be just one bead! It has to remember the spelling instead of looking at it.',
    probe: ' strawberry', fix: 'Ask it to spell the word out letter by letter first, or to use code to count.',
  },
  {
    id: 'decimal', emoji: '🔢', title: 'Which number is bigger?', pos: [-1.15, -0.15],
    q: 'Which is bigger: 9.11 or 9.9?', oops: '9.11 is bigger than 9.9.',
    why: 'The numbers get chopped into beads like “9”, “.”, “11”. Also, in things like book chapters and software versions, 9.11 really does come after 9.9! The model may have mixed those up.',
    probe: '9.11 vs 9.9', fix: 'Ask it to compare step by step, or to use code.',
  },
  {
    id: 'dots', emoji: '⚫', title: 'Counting lots of things', pos: [-0.2, -0.75],
    q: 'How many dots? ••••••••••••••••••••••••••', oops: 'There are 24 dots.',
    why: 'Long runs of dots get squished into a few big beads. Toki would have to count them all in one tiny cup of thinking!',
    probe: '••••••••••••••••••••••••••', fix: 'Ask it to use code. Code can count perfectly.',
  },
  {
    id: 'backwards', emoji: '🔄', title: 'Spelling backwards', pos: [-2.1, 0.45],
    q: 'Spell “ubiquitous” backwards.', oops: 'suotiuqibu… wait, suotiquibu?',
    why: 'Spelling is about single letters, and Toki sees chunks. Backwards spelling is extra hard!',
    probe: 'ubiquitous', fix: 'Ask it to write the letters one by one first, then reverse them.',
  },
]

function CheeseWedge({ open, found, onPick }: { open: string | null; found: string[]; onPick: (h: Hole) => void }) {
  const s = useFit(6.5, 4.6)
  const g = useRef<THREE.Group>(null)
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-2.6, -1.3)
    shape.lineTo(1.8, -1.3)
    shape.quadraticCurveTo(1.2, 0.2, -2.6, 1.4)
    shape.lineTo(-2.6, -1.3)
    return new THREE.ExtrudeGeometry(shape, { depth: 1.4, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1, bevelSegments: 4, curveSegments: 24 })
  }, [])
  useFrame(({ clock, pointer }) => {
    if (!g.current) return
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, -0.35 + pointer.x * 0.3, 0.05)
    g.current.rotation.x = 0.12 + Math.sin(clock.elapsedTime * 0.8) * 0.04
  })
  return (
    <group scale={s}>
      <Sprinkles count={24} />
      <Toki position={[2.5, -0.6, 0.5]} scale={0.55} mood={open ? 'oops' : 'happy'} />
      <group ref={g} position={[-0.3, 0.1, -0.7]}>
        <mesh geometry={geo}>
          <meshStandardMaterial color="#ffd23f" roughness={0.6} />
        </mesh>
        {/* decorative little holes */}
        {[[0.9, -0.95, 0.12], [-2.35, -1.1, 0.08], [-1.0, -1.0, 0.09], [0.4, -1.0, 0.08], [-1.6, 0.5, 0.1]].map(([x, y, r], i) => (
          <mesh key={i} position={[x, y, 1.51]}>
            <circleGeometry args={[r, 24]} />
            <meshStandardMaterial color="#d9a400" />
          </mesh>
        ))}
        {HOLES.map((h, i) => (
          <HoleMesh key={h.id} hole={h} n={i + 1} open={open === h.id} found={found.includes(h.id)} onPick={() => onPick(h)} />
        ))}
      </group>
    </group>
  )
}

function HoleMesh({ hole, n, open, found, onPick }: { hole: Hole; n: number; open: boolean; found: boolean; onPick: () => void }) {
  const ref = useRef<THREE.Mesh>(null)
  const [hover, setHover] = useState(false)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulse = found ? 1 : 1 + Math.sin(clock.elapsedTime * 3 + n) * 0.06
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, (open ? 1.25 : hover ? 1.12 : 1) * pulse, 0.2))
  })
  return (
    <group position={[hole.pos[0], hole.pos[1], 1.52]}>
      <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onPick() }}
        onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}>
        <circleGeometry args={[0.36, 32]} />
        <meshStandardMaterial color={open ? '#ff6fae' : found ? '#b07d00' : '#8a5a00'} />
      </mesh>
      <Html center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }} position={[0, 0, 0.05]}>
        <div style={{ fontSize: 22 }}>{found ? '✅' : hole.emoji}</div>
      </Html>
    </group>
  )
}

export default function Cheese() {
  const earn = useApp((s) => s.earn)
  const tk = useTokenizer()
  const [open, setOpen] = useState<Hole | null>(null)
  const [found, setFound] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)

  const pick = (h: Hole) => {
    setOpen(h)
    setRevealed(false)
    blip('pop')
    if (!found.includes(h.id)) {
      const f = [...found, h.id]
      setFound(f)
      if (f.length === HOLES.length) { earn('cheese'); party() }
    }
  }
  const toks = open && tk ? tk.tokenize(open.probe) : []

  return (
    <Chapter num={9} title="The Swiss-Cheese Brain" sub="Super smart… with surprising little holes"
      story={<>
        <div className="card">
          <Explain
            kid={<>
              <p>Toki can write poems and explain science, but sometimes it trips on things that are <b>easy for you</b>! Its brain is like <b>Swiss cheese</b> 🧀: mostly yummy, with a few surprising holes.</p>
              <p>Tap the holes in the cheese to find them all! ({found.length}/{HOLES.length})</p>
            </>}
            curious={<>
              <p>LLM abilities are uneven: “jagged” or “Swiss cheese” capabilities. Many failures come from <b>tokenization</b> (the model doesn't see characters) and from the <b>fixed compute per token</b>.</p>
              <p>Newer models often get these classic examples right because they were trained on them or use tools. But the lesson still holds: check the important stuff! Tap the holes ({found.length}/{HOLES.length}).</p>
            </>}
          />
          <div className="btn-row">
            {HOLES.map((h) => (
              <button key={h.id} className={`btn small ${open?.id === h.id ? 'tangerine' : 'ghost'}`} onClick={() => pick(h)}>
                {found.includes(h.id) ? '✅' : h.emoji} {h.title}
              </button>
            ))}
          </div>
        </div>
        {open && (
          <div className="card tilt-l enter" key={open.id}>
            <h3>{open.emoji} {open.title}</h3>
            <div className="bubble user"><b>🧒</b> {open.q}</div>
            {!revealed ? (
              <button className="btn tangerine" style={{ marginTop: 10 }} onClick={() => { setRevealed(true); blip('boop') }}>What might Toki say?</button>
            ) : (
              <>
                <div className="bubble toki enter" style={{ marginTop: 8 }}><b>🤖</b> {open.oops} <span className="tag" style={{ background: 'var(--pink)' }}>oops!</span></div>
                <p style={{ marginTop: 12 }}><b>Why?</b> {open.why}</p>
                <p className="muted" style={{ marginBottom: 6 }}>What Toki actually sees:</p>
                <div className="chips">
                  {toks.map((t, i) => <span key={i} className="chip" style={{ background: colorFor(i) }}>{show(t.text)}<small>{t.id}</small></span>)}
                </div>
                <div className="callout" style={{ marginTop: 12 }}><span className="em">🛠️</span><div><b>Fix:</b> {open.fix}</div></div>
              </>
            )}
          </div>
        )}
      </>}
      play={<Stage hint="Tap a hole in the cheese!" camera={{ position: [0, 0.4, 8] }}>
        <CheeseWedge open={open?.id ?? null} found={found} onPick={pick} />
      </Stage>}
    />
  )
}
