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

// A made-up event that happened after Toki's reading stopped, plus the article a visitor might paste in.
const NEWS_Q = 'Who won the Lakeside Robot Race last weekend?'
const NEWS_OLD = 'Team Sprocket won the Lakeside Robot Race! 🏆 They are the champions, with their super-fast robot Zippy.'
const ARTICLE = 'Lakeside News, Sunday: In a thrilling finish, Team Pebble’s little robot Moss rolled past last year’s champions, Team Sprocket, to win this year’s Lakeside Robot Race.'
const NEWS_PASTED = 'According to the article you pasted, Team Pebble won this year’s race! Their robot Moss beat last year’s champions, Team Sprocket. 🏆'

type Mode = 'idle' | 'memory' | 'unsure' | 'searching' | 'searched' | 'old' | 'pasting' | 'pasted'

function Scene({ mode, lines }: { mode: Mode; lines: number }) {
  const s = useFit(8, 6.2)
  const cloud = useRef<THREE.Group>(null)
  const glass = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (cloud.current) {
      cloud.current.rotation.z = Math.sin(t) * 0.05
      cloud.current.scale.setScalar(1 + Math.sin(t * 2) * 0.03 + (mode === 'memory' || mode === 'old' ? 0.08 : 0))
    }
    if (glass.current) {
      const on = mode === 'searching'
      glass.current.visible = on || mode === 'searched'
      glass.current.position.set(2.4 + Math.cos(t * 3) * (on ? 0.5 : 0), 1.6 + Math.sin(t * 3) * (on ? 0.3 : 0), 0.6)
    }
  })
  const mood: Mood = mode === 'memory' || mode === 'old' ? 'oops' : mode === 'searching' || mode === 'unsure' || mode === 'pasting' ? 'think' : mode === 'searched' || mode === 'pasted' ? 'wow' : 'happy'
  return (
    <group scale={s}>
      <Sprinkles count={22} />
      <Toki position={[0, -0.4, 0]} scale={0.85} mood={mood} talking={mode === 'memory' || mode === 'old'} />
      {/* Fuzzy memory cloud: knowledge from training, blurry and vague */}
      <group ref={cloud} position={[-2.6, 1.4, -0.5]}>
        {[[0, 0, 0.7], [-0.6, -0.1, 0.5], [0.6, -0.1, 0.55], [0, 0.45, 0.5]].map(([x, y, r], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <sphereGeometry args={[r, 20, 20]} />
            <meshStandardMaterial color={mode === 'memory' || mode === 'old' ? '#f7aef8' : '#ffffff'} transparent opacity={0.55} roughness={1} />
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

  const askOld = () => { setMode('old'); setLines(0); setAnswer(NEWS_OLD); blip('boop') }
  const paste = () => {
    setMode('pasting'); setAnswer(''); setLines(0); blip('tick')
    let i = 0
    const id = setInterval(() => {
      i++
      setLines(i)
      if (i >= 8) { clearInterval(id); setMode('pasted'); setAnswer(NEWS_PASTED); blip('ding') }
    }, 160)
  }

  const answerBox = answer && (
    <div className="bubble toki enter" key={answer} style={{ marginTop: 8 }}>
      <b>🤖</b> {answer}
      {mode === 'memory' && <div style={{ marginTop: 6 }}><span className="tag" style={{ background: 'var(--pink)' }}>😬 totally made up!</span></div>}
      {mode === 'old' && <div style={{ marginTop: 6 }}><span className="tag" style={{ background: 'var(--pink)' }}>😬 old news, said with confidence!</span></div>}
    </div>
  )

  return (
    <Chapter title="Making Things Up" sub="Why chatbots sometimes invent facts, and how tools help"
      steps={[
        {
          title: '🦄 Try to trick Toki',
          body: <>
            <p>Let's ask Toki about someone who <b>doesn't exist</b>. (We made the name up!) Tap the button a few times.</p>
            <div className="bubble user"><b>🧒</b> Who is Orson Kovacs?</div>
            {answerBox}
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn pink" onClick={askMemory}>☁️ Ask Toki</button>
            </div>
            {n >= 2 && mode === 'memory' && <p className="muted enter" style={{ marginTop: 10 }}>Notice: a <b>different</b> made-up answer every time! That's the word wheel spinning on stuff it doesn't really know.</p>}
          </>,
          canNext: n >= 1,
          lockedHint: '👆 Ask Toki first',
          next: 'Why did it do that?',
        },
        {
          title: '🤔 Why does Toki make things up?',
          body: <Explain
            kid={<p>All of Toki's practice chats had <b>confident</b> answers. So Toki learned to <b>always sound sure</b>, even when it doesn't know! Making things up like this is called a <b>hallucination</b>.</p>}
            curious={<p>In fine-tuning data, “Who is X?” is always answered confidently. So for unknown names the model imitates that <i>style</i> and samples plausible-sounding facts: a <b>hallucination</b>.</p>}
          />,
          next: 'Fix #1',
        },
        {
          title: '🙋 Fix #1: say “I don\'t know”',
          body: <>
            <Explain
              kid={<p>Builders find questions Toki can't answer, and add practice chats where the right answer is <b>“I don't know”</b>.</p>}
              curious={<p>Probe the model for what it doesn't know, then add training examples where the correct response is to admit it.</p>}
            />
            <div className="bubble user"><b>🧒</b> Who is Orson Kovacs?</div>
            {mode === 'unsure' && answerBox}
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn mint" onClick={askUnsure}>🙋 Ask the trained Toki</button>
            </div>
          </>,
          next: 'Fix #2',
        },
        {
          title: '🔎 Fix #2: let Toki look it up',
          body: <>
            <Explain
              kid={<p>Give Toki a <b>search tool</b>! Toki writes a special <code>&lt;SEARCH&gt;</code> bead, the computer searches the web, and the results get written on Toki's <b>notepad</b> 📝 (in the box).</p>}
              curious={<p>The model emits special tokens like <code>&lt;SEARCH&gt;…&lt;/SEARCH&gt;</code>, which pause generation, run a real search and paste the results into the <b>context window</b>.</p>}
            />
            <div className="bubble user"><b>🧒</b> Who is Orson Kovacs?</div>
            {mode === 'searching' && <div className="bubble toki" style={{ marginTop: 8, fontFamily: 'ui-monospace, monospace' }}>&lt;SEARCH&gt; Orson Kovacs &lt;/SEARCH&gt; <span className="typing" /></div>}
            {mode === 'searched' && answerBox}
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn sky" onClick={search} disabled={mode === 'searching'}>🔎 Let Toki search</button>
            </div>
            {mode === 'searched' && (
              <div className="grid-2 enter" style={{ marginTop: 12 }}>
                <div className="callout"><span className="em">☁️</span><div><b>Memory (knobs)</b><br />Like something you read a month ago: fuzzy!</div></div>
                <div className="callout"><span className="em">📝</span><div><b>Notepad (context window)</b><br />Like notes right in front of you: sharp and exact.</div></div>
              </div>
            )}
            <p className="muted" style={{ fontSize: '.85rem', marginTop: 10 }}>Recorded examples. Orson Kovacs is a made-up name.</p>
          </>,
          next: 'What about new things?',
        },
        {
          title: '📅 Toki\'s reading stopped on a date',
          body: <>
            <Explain
              kid={<p>Toki's big reading pile was collected up to a certain day, and then the reading <b>stopped</b>. Anything that happened after that, Toki has <b>never seen</b>. But it might still answer confidently, using older stuff it remembers!</p>}
              curious={<p>Every model has a <b>knowledge cutoff</b>: its pre-training data ends at some date. Ask about later events and it continues the text with its best guess from older data, unless the facts are put into its context (search, a system prompt, or you).</p>}
            />
            <div className="bubble user"><b>🧒</b> {NEWS_Q}</div>
            {mode === 'old' && answerBox}
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn pink" onClick={askOld}>☁️ Ask Toki</button>
            </div>
            {mode === 'old' && <p className="muted enter" style={{ marginTop: 10 }}>Team Sprocket won <i>last</i> year, before Toki's reading stopped. Toki has no idea a new race happened.</p>}
          </>,
          canNext: mode === 'old' || mode === 'pasting' || mode === 'pasted',
          lockedHint: '👆 Ask Toki first',
          next: 'Fix #3',
        },
        {
          title: '📋 Fix #3: paste it in yourself',
          body: <>
            <Explain
              kid={<p>You can fill Toki's notepad <b>yourself</b>! Copy the article and paste it into your message. Now the facts are right in front of Toki, sharp and exact, instead of in its fuzzy memory.</p>}
              curious={<p>Anything you paste goes straight into the <b>context window</b>, the model's working memory. Even for things it probably knows (say, a chapter of a famous book), pasting the text gives better answers than relying on recollection.</p>}
            />
            <div className="bubble user">
              <b>🧒</b> {NEWS_Q}
              {(mode === 'pasting' || mode === 'pasted') && <div className="enter" style={{ marginTop: 8, padding: 8, borderRadius: 12, border: '2px dashed var(--line)', fontSize: '.9rem' }}>📋 {ARTICLE}</div>}
            </div>
            {mode === 'pasted' && answerBox}
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn mint" onClick={paste} disabled={mode === 'pasting'}>📋 Paste the news article</button>
            </div>
            {mode === 'pasted' && (
              <div className="callout enter" style={{ marginTop: 12 }}><span className="em">💡</span>
                <div><b>Your super-power:</b> when the answer matters, give Toki the facts. Paste the article, the homework sheet or the recipe, then ask.</div>
              </div>
            )}
            <p className="muted" style={{ fontSize: '.85rem', marginTop: 10 }}>Recorded example. The race and the teams are made up.</p>
          </>,
        },
      ]}
      play={<Stage hint={mode === 'searching' ? 'Searching… filling the notepad' : mode === 'pasting' ? 'Your paste goes on the notepad' : 'Fuzzy memory ☁️ vs. sharp notepad 📝'} camera={{ position: [0, 0.3, 9] }}>
        <Scene mode={mode} lines={lines} />
      </Stage>}
    />
  )
}
