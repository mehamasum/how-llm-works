import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { Toki } from '../three/Toki'
import { Bead } from '../three/Bead'
import { useFit } from '../three/useFit'
import { colorFor } from '../ui/colors'
import { useApp } from '../store'
import { blip } from '../sound'
import { party } from '../ui/confetti'

// An 8×8 pixel-art sun. Each letter is a colour; it gets chopped into 2×2 patches (16 "picture beads").
const ART = [
  '..y..y..',
  '.y.oo.y.',
  '..oyyo..',
  'yoyyyyoy',
  'yoyyyyoy',
  '..oyyo..',
  '.y.oo.y.',
  '..y..y..',
]
const INK: Record<string, string> = { y: '#ffc93c', o: '#ff8c42', '.': '#bde0fe' }
const PATCH = 2
const PX = 0.42

function PictureBeads({ chopped }: { chopped: boolean }) {
  const s = useFit(7.5, 6)
  const patches = useMemo(() => {
    const out: { r: number; c: number; pixels: { x: number; y: number; color: string }[] }[] = []
    for (let r = 0; r < 8 / PATCH; r++) {
      for (let c = 0; c < 8 / PATCH; c++) {
        const pixels = []
        for (let y = 0; y < PATCH; y++) for (let x = 0; x < PATCH; x++) pixels.push({ x, y, color: INK[ART[r * PATCH + y][c * PATCH + x]] })
        out.push({ r, c, pixels })
      }
    }
    return out
  }, [])
  const groups = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    patches.forEach((p, i) => {
      const g = groups.current[i]
      if (!g) return
      const whole = new THREE.Vector3((p.c - 1.5) * PATCH * PX, (1.5 - p.r) * PATCH * PX + 0.3, 0)
      // chopped: a two-row necklace of patch beads, in reading order
      const row = Math.floor(i / 8), col = i % 8
      const bead = new THREE.Vector3((col - 3.5) * 0.86, 0.7 - row * 1.3, 0.3)
      g.position.lerp(chopped ? bead : whole, 0.08)
      const sc = chopped ? 0.85 : 1
      g.scale.lerp(new THREE.Vector3(sc, sc, sc), 0.08)
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, chopped ? 0.35 : 0, 0.08)
    })
  })
  return (
    <group scale={s}>
      <Sprinkles count={18} />
      {patches.map((p, i) => (
        <group key={i} ref={(g) => { groups.current[i] = g }}>
          {p.pixels.map((px, k) => (
            <mesh key={k} position={[(px.x - 0.5) * PX, (0.5 - px.y) * PX, 0]}>
              <boxGeometry args={[PX * 0.95, PX * 0.95, PX * 0.6]} />
              <meshStandardMaterial color={px.color} roughness={0.4} />
            </mesh>
          ))}
          {chopped && (
            <mesh position={[0, 0, -0.2]}>
              <torusGeometry args={[0.5, 0.05, 8, 32]} />
              <meshStandardMaterial color={colorFor(i)} emissive={colorFor(i)} emissiveIntensity={0.4} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

function Lookout({ step }: { step: number }) {
  const s = useFit(6, 6)
  const ring = useRef<THREE.Group>(null)
  useFrame((_, dt) => { if (ring.current) ring.current.rotation.y += dt * 0.5 })
  const n = step === 1 ? 6 : 8
  return (
    <group scale={s}>
      <Sprinkles count={28} />
      <Toki position={[0, -0.2, 0]} scale={0.9} mood={step === 3 ? 'wow' : 'happy'} talking={step === 1} />
      <group ref={ring} rotation={[0.3, 0, 0]}>
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2
          return <Bead key={`${step}-${i}`} position={[Math.cos(a) * 2.4, Math.sin(a * 2) * 0.3, Math.sin(a) * 2.4]} color={colorFor(i + step)} size={0.26} delay={i * 0.06} phase={i} special={step === 1 && i % 2 === 0} />
        })}
      </group>
    </group>
  )
}

const TIPS = [
  { id: 'paste', label: '📋 Paste the facts in' },
  { id: 'code', label: '🧮 Ask it to use code' },
  { id: 'steps', label: '🪜 Ask for steps (or a thinking model)' },
  { id: 'check', label: '✅ Double-check it' },
]
const CASES = [
  { q: 'You want a summary of a news story from this morning.', tip: 'paste', why: "It happened after Toki's reading stopped, so put the article on its notepad (or let it search)." },
  { q: 'You need to know how many times the letter “e” appears in a long paragraph.', tip: 'code', why: "Toki sees beads, not letters, and counting in one cup of thinking is hard. Code counts perfectly." },
  { q: 'You have a tricky maths word problem with lots of parts.', tip: 'steps', why: 'Each bead gets only a small cup of thinking, so the work needs spreading out over many beads.' },
  { q: 'Toki gave you a surprising “fact” for your school report.', tip: 'check', why: 'Toki can confidently make things up. For anything important, check a trusted source.' },
]

function Toolbox({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const c = CASES[i]
  if (!c) {
    return (
      <div className="enter">
        <p className="big-num">{score} / {CASES.length} 🧰</p>
        <p>You know how to get the best out of a chatbot!</p>
        <button className="btn small ghost" onClick={() => { setI(0); setScore(0) }}>Play again</button>
      </div>
    )
  }
  const pick = (id: string) => {
    if (picked) return
    setPicked(id)
    if (id === c.tip) { setScore((s) => s + 1); blip('pop') } else blip('boop')
  }
  const next = () => {
    setPicked(null)
    setI(i + 1)
    if (i + 1 === CASES.length) onDone()
  }
  return (
    <>
      <p className="muted">Case {i + 1} of {CASES.length}: which tool helps most?</p>
      <div className="bubble user">{c.q}</div>
      <div className="btn-row" style={{ marginTop: 10 }}>
        {TIPS.map((t) => (
          <button key={t.id} className={`btn small ${picked ? (t.id === c.tip ? 'mint' : t.id === picked ? 'pink' : 'ghost') : 'ghost'}`} onClick={() => pick(t.id)}>{t.label}</button>
        ))}
      </div>
      {picked && (
        <div className="callout enter" style={{ marginTop: 12 }}>
          <span className="em">{picked === c.tip ? '🎉' : '🤔'}</span>
          <div><b>{picked === c.tip ? 'Yes!' : 'Close, but…'}</b> {c.why}
            <div style={{ marginTop: 8 }}><button className="btn small" onClick={next}>Next ▶</button></div>
          </div>
        </div>
      )}
    </>
  )
}

export default function Next() {
  const earn = useApp((s) => s.earn)
  const [chopped, setChopped] = useState(false)
  const [done, setDone] = useState(false)

  return (
    <Chapter title="What's Next & Your Turn" sub="Where chatbots are heading, and how to use them well today"
      steps={[
        {
          title: '🖼️ Pictures become beads too',
          body: <>
            <Explain
              kid={<>
                <p>So far Toki only read text. But a picture can be chopped into <b>little square patches</b>, and each patch becomes a bead, just like words! Sounds can be chopped into tiny slices of time too.</p>
                <p>Mix picture beads, sound beads and word beads in one necklace, and Toki can <b>see, hear and talk</b>, all with the same guessing game.</p>
              </>}
              curious={<p>Models are going <b>multimodal</b>. Images are split into patches and audio into short chunks, each encoded as tokens. Interleaved with text tokens, the same next-token machinery can read and generate images and speech natively.</p>}
            />
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button className="btn sky" onClick={() => { setChopped(!chopped); blip('pop') }}>{chopped ? '🧩 Put the picture back' : '✂️ Chop it into beads'}</button>
              {chopped && <span className="tag enter">16 picture beads</span>}
            </div>
          </>,
          next: 'What else is coming?',
        },
        {
          title: '🤖 From helper to agent',
          body: <Explain
            kid={<>
              <p>Today you ask Toki for <b>one thing at a time</b>. Next, Toki-like helpers will do <b>whole jobs</b>: plan a trip, fix a bug, research a topic, working for a long time and checking in with you.</p>
              <p>Some can already <b>use a computer</b> like you do: moving the mouse, typing, clicking buttons. And AI will hide inside lots of everyday apps.</p>
              <p>Grown-ups will act like <b>team leaders</b>, keeping an eye on their AI helpers.</p>
            </>}
            curious={<>
              <p><b>Agents</b> string many steps together on long-running tasks, using tools and correcting their own mistakes, with humans supervising, like managers of digital workers.</p>
              <p><b>Computer use</b> lets models act through the keyboard and mouse, and models are becoming pervasive inside other tools. Research continues on things like models that keep learning after training.</p>
            </>}
          />,
          next: 'Where can I find models?',
        },
        {
          title: '🧭 Where these models live',
          body: <>
            <div style={{ display: 'grid', gap: 10 }}>
              <div className="callout"><span className="em">☁️</span>
                <Explain
                  kid={<div><b>In company apps.</b> Most chatbots run on the company's big computers. Whatever you type travels to them, so <b>never share private stuff</b> like passwords or addresses.</div>}
                  curious={<div><b>Hosted apps and APIs.</b> Most capable models run in the provider's data centres. Your prompts are sent to them, so check their data policy before pasting anything sensitive.</div>}
                />
              </div>
              <div className="callout"><span className="em">📦</span>
                <Explain
                  kid={<div><b>Open models.</b> Some companies share the <b>file of knob numbers</b> and the program for free. Anyone can download them!</div>}
                  curious={<div><b>Open-weights models</b> (e.g. Llama, DeepSeek) publish the parameter file and code. Other companies host them, or you can run them yourself.</div>}
                />
              </div>
              <div className="callout"><span className="em">💻</span>
                <Explain
                  kid={<div><b>On your own computer.</b> Smaller, squished-down versions of open models can run right on a laptop, with nothing sent anywhere.</div>}
                  curious={<div><b>Locally.</b> Distilled (smaller) variants at reduced numeric precision fit on a laptop GPU, so prompts never leave your machine.</div>}
                />
              </div>
              <div className="callout"><span className="em">🏁</span>
                <Explain
                  kid={<div><b>Which one is best?</b> New ones come out all the time. Websites let people vote on answers side by side, but the scores can be tricked. The best test is trying them yourself!</div>}
                  curious={<div><b>Keeping up.</b> Leaderboards built from people comparing answers side by side are useful but can be gamed, so treat them as a first filter and test models on your own tasks.</div>}
                />
              </div>
            </div>
          </>,
          next: 'Pack your toolbox',
        },
        {
          title: '🧰 Pack your toolbox',
          body: <>
            <p>You've seen how Toki works inside. Now use it! Pick the best tool for each case:</p>
            <Toolbox onDone={() => { if (!done) { setDone(true); earn('next'); party() } }} />
          </>,
        },
      ]}
      play={(step) => (
        <Stage hint={step === 0 ? (chopped ? 'Each patch is now a bead' : 'A tiny pixel picture') : step === 3 ? 'Toki is ready to help!' : 'Toki is growing up'} camera={{ position: [0, 0.3, 9] }}>
          {step === 0 ? <PictureBeads chopped={chopped} /> : <Lookout step={step} />}
        </Stage>
      )}
    />
  )
}
