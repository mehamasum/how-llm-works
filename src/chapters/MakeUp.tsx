import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { Toki, type Mood } from '../three/Toki'
import { useFit } from '../three/useFit'
import { useApp } from '../store'
import { blip } from '../sound'

// "Orson Kovacs" is made up on purpose, like in Karpathy's talk. Answers are recorded examples.
const MADE_UP = [
  'Orson Kovacs is an American science-fiction writer, best known for his 1998 novel “The Glass Comet”. 🌠',
  'Orson Kovacs was a Hungarian Olympic swimmer who won a silver medal in 1964. 🏊',
  'Orson Kovacs is a famous TV chef from Canada, known for his giant pancakes. 🥞',
]

type Mode = 'idle' | 'memory' | 'unsure' | 'searching' | 'searched'

function Scene({ mode, lines }: { mode: Mode; lines: number }) {
  const s = useFit(8, 6.2)
  const cloud = useRef<THREE.Group>(null)
  const glass = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (cloud.current) {
      cloud.current.rotation.z = Math.sin(t) * 0.05
      cloud.current.scale.setScalar(1 + Math.sin(t * 2) * 0.03 + (mode === 'memory' ? 0.08 : 0))
    }
    if (glass.current) {
      const on = mode === 'searching'
      glass.current.visible = on || mode === 'searched'
      glass.current.position.set(2.4 + Math.cos(t * 3) * (on ? 0.5 : 0), 1.6 + Math.sin(t * 3) * (on ? 0.3 : 0), 0.6)
    }
  })
  const mood: Mood = mode === 'memory' ? 'oops' : mode === 'searching' || mode === 'unsure' ? 'think' : mode === 'searched' ? 'wow' : 'happy'
  return (
    <group scale={s}>
      <Sprinkles count={22} />
      <Toki position={[0, -0.4, 0]} scale={0.85} mood={mood} talking={mode === 'memory'} />
      {/* Fuzzy memory cloud: knowledge from training, blurry and vague */}
      <group ref={cloud} position={[-2.6, 1.4, -0.5]}>
        {[[0, 0, 0.7], [-0.6, -0.1, 0.5], [0.6, -0.1, 0.55], [0, 0.45, 0.5]].map(([x, y, r], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <sphereGeometry args={[r, 20, 20]} />
            <meshStandardMaterial color={mode === 'memory' ? '#f7aef8' : '#ffffff'} transparent opacity={0.55} roughness={1} />
          </mesh>
        ))}
        {[-0.4, 0.1, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.6]}>
            <torusGeometry args={[0.12, 0.04, 6, 12, Math.PI * 1.4]} />
            <meshStandardMaterial color="#9b5de5" />
          </mesh>
        ))}
      </group>
      {/* Notepad: the context window, sharp and exact */}
      <group position={[2.6, 0.2, 0]} rotation={[0, -0.35, 0.05]}>
        <RoundedBox args={[1.7, 2.2, 0.08]} radius={0.08}>
          <meshStandardMaterial color="#fffbe8" />
        </RoundedBox>
        <mesh position={[0, 1.05, 0.06]}>
          <boxGeometry args={[1.7, 0.18, 0.04]} />
          <meshStandardMaterial color="#ff6fae" />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[-0.1 + (i < lines ? 0 : -0.5), 0.75 - i * 0.22, 0.05]} scale={[i < lines ? 1 : 0.0001, 1, 1]}>
            <boxGeometry args={[1.2 - (i % 3) * 0.2, 0.07, 0.02]} />
            <meshStandardMaterial color="#4cc9f0" />
          </mesh>
        ))}
      </group>
      <group ref={glass} visible={false}>
        <mesh>
          <torusGeometry args={[0.3, 0.07, 10, 24]} />
          <meshStandardMaterial color="#ffc93c" metalness={0.4} roughness={0.2} />
        </mesh>
        <mesh position={[0.32, -0.32, 0]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 10]} />
          <meshStandardMaterial color="#2b2140" />
        </mesh>
      </group>
    </group>
  )
}

export default function MakeUp() {
  const earn = useApp((s) => s.earn)
  const [mode, setMode] = useState<Mode>('idle')
  const [answer, setAnswer] = useState('')
  const [n, setN] = useState(0)
  const [lines, setLines] = useState(0)

  const askMemory = () => {
    setMode('memory'); setAnswer(MADE_UP[n % MADE_UP.length]); setN(n + 1); setLines(0); blip('boop')
  }
  const askUnsure = () => {
    setMode('unsure'); setLines(0); blip('pop')
    setAnswer("Hmm, I don't know who Orson Kovacs is. 🤔 I might be missing that, or they might not be famous. Want me to search the web?")
  }
  const search = () => {
    setMode('searching'); setAnswer(''); setLines(0); blip('tick')
    let i = 0
    const id = setInterval(() => {
      i++
      setLines(i)
      blip('tick')
      if (i >= 8) {
        clearInterval(id)
        setMode('searched')
        setAnswer('I searched the web and found no famous person called Orson Kovacs. So I won\'t make anything up! If you tell me where you heard the name, I can look again. 🔎')
        earn('makeup')
      }
    }, 280)
  }

  return (
    <Chapter num={7} title="Making Things Up" sub="Why chatbots sometimes invent facts, and how tools help"
      story={<>
        <div className="card">
          <Explain
            kid={<>
              <p>Toki learned to <b>always sound confident</b>, because all its practice chats had confident answers. So when it <i>doesn't know</i> something… it might just <b>make something up!</b> 🦄 That's called a <b>hallucination</b>.</p>
              <p>Two fixes: teach Toki to say <b>“I don't know”</b>, and give it <b>tools</b>, like a web search, so it can look things up.</p>
            </>}
            curious={<>
              <p>In fine-tuning data, “Who is X?” is always answered confidently. So for unknown names the model imitates that <i>style</i> and samples plausible-sounding facts: a <b>hallucination</b>.</p>
              <p>Mitigations: (1) probe what the model doesn't know and add training examples where the right answer is “I don't know”; (2) let it emit special tokens like <code>&lt;SEARCH&gt;…&lt;/SEARCH&gt;</code>, which pause generation, run a real search and paste the results into the <b>context window</b>.</p>
            </>}
          />
          <div className="grid-2" style={{ marginTop: 6 }}>
            <div className="callout"><span className="em">☁️</span><div><b>Memory (knobs)</b><br />Like something you read a month ago: fuzzy!</div></div>
            <div className="callout"><span className="em">📝</span><div><b>Notepad (context window)</b><br />Like notes right in front of you: sharp and exact.</div></div>
          </div>
        </div>
        <div className="card tilt-l">
          <h3>🦄 Try to trick Toki</h3>
          <div className="bubble user"><b>🧒</b> Who is Orson Kovacs?</div>
          {answer && (
            <div className="bubble toki enter" key={answer} style={{ marginTop: 8 }}>
              <b>🤖</b> {answer}
              {mode === 'memory' && <div style={{ marginTop: 6 }}><span className="tag" style={{ background: 'var(--pink)' }}>😬 totally made up!</span></div>}
            </div>
          )}
          {mode === 'searching' && <div className="bubble toki" style={{ marginTop: 8, fontFamily: 'ui-monospace, monospace' }}>&lt;SEARCH&gt; Orson Kovacs &lt;/SEARCH&gt; <span className="typing" /></div>}
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button className="btn pink" onClick={askMemory}>☁️ Answer from memory</button>
            <button className="btn ghost small" onClick={askUnsure}>🙋 Trained to say “I don't know”</button>
            <button className="btn sky" onClick={search} disabled={mode === 'searching'}>🔎 Let Toki search</button>
          </div>
          {n >= 2 && mode === 'memory' && <p className="muted enter" style={{ marginTop: 10 }}>Notice: a <b>different</b> made-up answer every time! That's the word wheel spinning on stuff it doesn't really know.</p>}
          <p className="muted" style={{ fontSize: '.85rem', marginTop: 10 }}>Recorded examples. Orson Kovacs is a made-up name.</p>
        </div>
      </>}
      play={<Stage hint={mode === 'searching' ? 'Searching… filling the notepad' : 'Fuzzy memory ☁️ vs. sharp notepad 📝'} camera={{ position: [0, 0.3, 9] }}>
        <Scene mode={mode} lines={lines} />
      </Stage>}
    />
  )
}
