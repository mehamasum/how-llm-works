import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Stage } from '../three/Stage'
import { Toki, type Mood } from '../three/Toki'
import { Bead } from '../three/Bead'
import { Sprinkles } from '../three/Sprinkles'
import { useFit } from '../three/useFit'
import { colorFor } from '../ui/colors'
import { useApp } from '../store'
import { goTo } from '../nav'
import { blip } from '../sound'
import { Explain } from '../ui/Explain'

function Orbit({ n, burst }: { n: number; burst: number }) {
  const g = useRef<THREE.Group>(null)
  const speed = useRef(0.4)
  useEffect(() => { if (burst) speed.current = 5 }, [burst])
  useFrame((_, dt) => {
    speed.current = THREE.MathUtils.lerp(speed.current, 0.4, Math.min(1, dt * 1.2))
    if (g.current) g.current.rotation.y += dt * speed.current
  })
  return (
    <group ref={g} rotation={[0.25, 0, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2
        return <Bead key={`${burst}-${i}`} position={[Math.cos(a) * 2.6, Math.sin(a * 3) * 0.3, Math.sin(a) * 2.6]} color={colorFor(i)} size={0.28} delay={i * 0.05} phase={i} />
      })}
    </group>
  )
}

function Scene({ mood, n, burst }: { mood: Mood; n: number; burst: number }) {
  const s = useFit(7, 6.8)
  return (
    <group scale={s}>
      <Sprinkles count={36} />
      <Toki mood={mood} talking={burst > 0 && mood === 'wow'} position={[0, 0.3, 0]} />
      <Orbit n={n} burst={burst} />
    </group>
  )
}

export default function Hello() {
  const { sentence, setSentence, earn } = useApp()
  const [draft, setDraft] = useState(sentence)
  const [burst, setBurst] = useState(0)
  const [mood, setMood] = useState<Mood>('happy')

  const send = () => {
    if (!draft.trim()) return
    setSentence(draft.trim())
    setBurst((b) => b + 1)
    setMood('wow')
    blip('ding')
    earn('hello')
    setTimeout(() => setMood('happy'), 2200)
  }

  return (
    <article className="enter">
      <div className="chapter-grid">
        <div className="story-col">
          <span className="sticker">A playful guide to ChatGPT-style AI</span>
          <h1 style={{ fontSize: 'clamp(2.1rem, 7vw, 3.6rem)', margin: '14px 0 10px' }}>
            What happens when you <span style={{ color: 'var(--accent)' }}>press Enter</span>? 🤔
          </h1>
          <Explain
            kid={<p>Hi! I'm <b>Toki</b> 🤖. I'm a tiny robot who learned to talk by reading <i>a lot</i>. Type something to me, and then come on an adventure to see what happens inside my head!</p>}
            curious={<p>Chatbots like ChatGPT are <b>large language models</b> (LLMs). This tour follows the real recipe used to build them — collecting text, tokenizing, pre-training, fine-tuning on conversations and reinforcement learning — with live toy models you can poke.</p>}
          />
          <div className="card tilt-l" style={{ marginTop: 18 }}>
            <label htmlFor="sentence"><b>Say something to Toki</b> <span className="muted">(we'll use it all the way through)</span></label>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <input id="sentence" className="input" style={{ flex: '1 1 240px' }} value={draft} maxLength={160}
                onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
              <button className="btn pink" onClick={send}>Enter ⏎</button>
            </div>
            {burst > 0 && (
              <div className="callout enter" style={{ marginTop: 14 }}>
                <span className="em">✨</span>
                <div>
                  <b>Whoosh!</b> Your words just turned into those spinning candy beads. Toki will now guess what comes next — one bead at a time. Want to see how?
                </div>
              </div>
            )}
          </div>
          <div className="btn-row" style={{ marginTop: 22 }}>
            <button className="btn grape" onClick={() => goTo(1)}>Start the adventure 🚀</button>
          </div>
          <p className="muted" style={{ marginTop: 18, fontSize: '.95rem' }}>
            Tip: flip <b>🧒 Kid</b> / <b>🔍 Curious</b> at the top for simpler or deeper explanations. Based on Andrej Karpathy's talk “Deep Dive into LLMs like ChatGPT”.
          </p>
        </div>
        <div className="play-col">
          <Stage hint="👆 Toki follows your finger" camera={{ position: [0, 0.5, 8.5] }}>
            <Scene mood={mood} n={Math.min(24, Math.max(8, sentence.split(/\s+/).length))} burst={burst} />
          </Stage>
        </div>
      </div>
    </article>
  )
}
