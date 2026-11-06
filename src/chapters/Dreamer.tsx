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
import { PALETTE } from '../ui/colors'
import { useApp } from '../store'
import { blip } from '../sound'

// Recorded examples, written to show how a *base* model (before chat training) behaves.
type Demo = { id: string; label: string; emoji: string; prompt: string; dreams: string[]; lesson: string }
const DEMOS: Demo[] = [
  {
    id: 'question', label: 'Ask it a question', emoji: '❓',
    prompt: 'What is 2 + 2?',
    dreams: [
      '\nWhat is 3 + 3?\nWhat is 4 + 4?\nWhat is 5 + 5?\n\nPractice Sheet 1 — Addition (Grade 1)',
      '\n\nA) 3   B) 4   C) 5   D) 22\n\nQuestion 2: What is 6 − 1?',
      ' This is a question I always ask my students on the first day of class. Most of them giggle…',
    ],
    lesson: "It doesn't answer you! It just guesses what web page this might be — like a worksheet full of more questions.",
  },
  {
    id: 'wiki', label: 'Start a Wikipedia page', emoji: '📚',
    prompt: 'The giant panda is a bear species',
    dreams: [
      ' native to China. It is known for its black-and-white fur and its diet, which is almost entirely bamboo. Adult pandas can eat up to 12 kilograms of bamboo a day…',
      ' that lives in the mountain forests of central China. Giant pandas spend around 10 to 16 hours a day feeding…',
    ],
    lesson: 'It continues in the same style — it has read so many encyclopedia pages that it can dream new ones.',
  },
  {
    id: 'translate', label: 'Few-shot trick', emoji: '🪄',
    prompt: 'English: cat → French: chat\nEnglish: dog → French: chien\nEnglish: teacher → French: professeur\nEnglish: strawberry → French:',
    dreams: [' fraise\nEnglish: apple → French: pomme', ' fraise\nEnglish: house → French: maison'],
    lesson: 'Show it a pattern, and it keeps the pattern going. This is called few-shot prompting — a sneaky way to make a base model useful.',
  },
  {
    id: 'memory', label: 'A famous rhyme', emoji: '⭐',
    prompt: 'Twinkle, twinkle, little star,',
    dreams: ['\nHow I wonder what you are!\nUp above the world so high,\nLike a diamond in the sky.'],
    lesson: "It has seen this rhyme so many times that it remembers it word-for-word. That's called memorizing (or regurgitation).",
  },
  {
    id: 'pretend', label: 'Pretend chat page', emoji: '🎭',
    prompt: 'A conversation between a curious kid and a helpful, friendly AI assistant.\n\nKid: What do bees make?\nAssistant: Bees make honey from the nectar of flowers!\nKid: Why is the sky blue?\nAssistant:',
    dreams: [
      ' Sunlight is made of all the colours, and the air scatters blue light the most, so we see blue everywhere!\nKid: Cool! Why is grass green?\nAssistant: Grass is full of',
      ' Because the air bounces blue light around more than other colours.\nKid: what about sunsets\nKid: hello??\nComments (14)  ·  Share  ·  Report',
    ],
    lesson: "Dress the page up as a chat, and the dreamer plays the assistant! But it's wobbly: it may keep writing the kid's lines too, or wander off the page. That's why builders teach chatting properly next.",
  },
]

function DreamCloud({ dreaming }: { dreaming: boolean }) {
  const s = useFit(7, 6.6)
  const pages = useRef<THREE.Group>(null)
  useFrame(({ clock }, dt) => {
    if (!pages.current) return
    pages.current.rotation.y += dt * (dreaming ? 1.2 : 0.25)
    pages.current.position.y = 1.4 + Math.sin(clock.elapsedTime) * 0.1
  })
  const puffs: [number, number, number, number][] = [[0, 1.4, -0.5, 1.1], [-1.1, 1.3, -0.6, 0.8], [1.1, 1.3, -0.6, 0.85], [-0.55, 1.95, -0.7, 0.75], [0.6, 1.95, -0.7, 0.8], [-1.6, 0.4, -0.3, 0.22], [-1.25, 0.05, -0.2, 0.14]]
  return (
    <group scale={s} position={[0, -0.3, 0]}>
      <Sprinkles count={24} />
      <Toki position={[-1.4, -1.2, 0.5]} scale={0.75} mood={dreaming ? 'sleepy' : 'happy'} />
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x + 0.6, y, z]}>
          <sphereGeometry args={[r, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.92} />
        </mesh>
      ))}
      <group ref={pages} position={[0.6, 1.4, 0.4]}>
        {PALETTE.slice(0, 6).map((c, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <RoundedBox key={i} args={[0.35, 0.45, 0.04]} radius={0.03} position={[Math.cos(a) * 0.9, Math.sin(i * 2) * 0.15, Math.sin(a) * 0.9]} rotation={[0, -a, 0.1]}>
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={dreaming ? 0.5 : 0.1} />
            </RoundedBox>
          )
        })}
      </group>
      {dreaming && <Zzz />}
    </group>
  )
}

function Zzz() {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.6 + i / 3) % 1
      c.position.set(-0.9 + t * 0.6, -0.1 + t * 1.2, 0.8)
      c.scale.setScalar(0.1 + t * 0.15)
    })
  })
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <torusGeometry args={[0.6, 0.25, 8, 4]} />
          <meshStandardMaterial color="#9b5de5" emissive="#9b5de5" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function useTypewriter(text: string, speed = 28) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    if (!text) return
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed)
    return () => clearInterval(id)
  }, [text, speed])
  return { shown: text.slice(0, n), done: n >= text.length }
}

export default function Dreamer() {
  const earn = useApp((s) => s.earn)
  const [demo, setDemo] = useState(DEMOS[0])
  const [k, setK] = useState(-1)
  const dream = k >= 0 ? demo.dreams[k % demo.dreams.length] : ''
  const { shown, done } = useTypewriter(dream)

  const go = () => { setK((v) => v + 1); blip('pop'); earn('dreamer') }
  const choose = (d: Demo) => { setDemo(d); setK(-1) }

  const dreamBox = (
    <>
      <div className="bubble" style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace', fontSize: '.95rem', minHeight: 120 }}>
        <span style={{ fontWeight: 800 }}>{demo.prompt}</span>
        <span style={{ color: 'var(--accent)' }} className={k >= 0 && !done ? 'typing' : ''}>{shown}</span>
      </div>
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button className="btn grape" onClick={go}>{k < 0 ? '💤 Dream on!' : '🔁 Dream again'}</button>
      </div>
      {k >= 0 && done && (
        <div className="callout enter" style={{ marginTop: 12 }}><span className="em">💡</span><div>{demo.lesson}</div></div>
      )}
    </>
  )

  return (
    <Chapter title="The Document Dreamer" sub="After all that reading, Toki is a… page dreamer?"
      steps={[
        {
          title: '💭 Toki, the page dreamer',
          body: <Explain
            kid={<p>After reading the whole internet, Toki is really good at one thing: <b>continuing any page</b>. Give it the start of something, and it dreams up what comes next.</p>}
            curious={<p>The result of pre-training is a <b>base model</b>: an “internet document simulator”. It continues token sequences in the statistical style of its training data.</p>}
          />,
          next: 'Ask it a question',
        },
        {
          title: '❓ Ask it a question',
          body: <>
            <p>Let's ask the dreamer a simple question. Tap <b>Dream on!</b>, then <b>Dream again</b>.</p>
            <p className="muted">Each dream is different, because Toki picks every next bead with a little <b>dice roll</b>. You'll spin those dice yourself later!</p>
            {demo.id === 'question' ? dreamBox : <button className="btn ghost small" onClick={() => choose(DEMOS[0])}>Show the question again</button>}
          </>,
          next: 'Try other pages',
        },
        {
          title: '🪄 Start other pages',
          body: <>
            <p>Pick a page for Toki to continue:</p>
            <div className="btn-row">
              {DEMOS.slice(1).map((d) => (
                <button key={d.id} className={`btn small ${d.id === demo.id ? 'grape' : 'ghost'}`} onClick={() => choose(d)}>{d.emoji} {d.label}</button>
              ))}
            </div>
            {demo.id !== 'question' && <div style={{ marginTop: 12 }}>{dreamBox}</div>}
          </>,
          next: 'So what is it?',
        },
        {
          title: '🧠 A fuzzy copy of the internet',
          body: <>
            <Explain
              kid={<p>Toki remembers the internet a bit like a <b>dream</b>: lots of it, but fuzzy. Things it saw many times (like famous rhymes) it remembers word for word. Tricks like the 🎭 pretend chat page help a bit, but it's <b>not a reliable helper yet</b>!</p>}
              curious={<p>Its knowledge lives in its parameters as a <b>lossy compression</b> of the internet: vague recollections, with frequently-seen text sometimes recalled verbatim. Clever prompts help: few-shot examples, or a page formatted as a Human/Assistant conversation that it continues. But that assistant is fragile and easily drifts, so it isn't a real assistant yet.</p>}
            />
            <p className="muted" style={{ fontSize: '.85rem' }}>The dreams in this chapter are recorded examples showing typical base-model behaviour.</p>
          </>,
        },
      ]}
      play={<Stage hint="Toki is dreaming up pages" camera={{ position: [0, 0.3, 8] }}>
        <DreamCloud dreaming={k >= 0 && !done} />
      </Stage>}
    />
  )
}
