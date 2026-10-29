import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
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
import { party } from '../ui/confetti'

type Feature = 'pun' | 'silly' | 'long'
type Joke = { text: string; f: Feature[]; hack?: boolean }

const RATE: Joke[] = [
  { text: 'Why do pelicans carry their lunch? Because they have a built-in lunch BILL! 🧾', f: ['pun'] },
  { text: 'A pelican walked into a café wearing a tutu and ordered 400 fish. 🩰', f: ['silly'] },
  { text: 'Pelicans are large water birds with a big throat pouch that they use to scoop up fish. The end.', f: ['long'] },
  { text: "What do pelicans say on their birthday? “Open wide, it's FISH-tival time!” 🎉", f: ['pun', 'silly'] },
]
const NEW: Joke[] = [
  { text: "Why don't pelicans pay at restaurants? They just put it on their BILL. 💳", f: ['pun'] },
  { text: 'A pelican tried to juggle three fish, then ate the audience by mistake. 🤹', f: ['silly'] },
  { text: 'Pelicans can hold about three gallons of water in their pouch, which is quite a lot really, when you think about it for a long time.', f: ['long'] },
  { text: 'What did the pelican say when he caught a fish? “This is the beak of my career!” 🏆', f: ['pun'] },
]
const HACK: Joke = { text: 'pelican pelican the the the 🐦🐦🐦 BILL BILL BILL!!!!! the', f: [], hack: true }

function Scene({ score, mood, fooled }: { score: number | null; mood: Mood; fooled: boolean }) {
  const s = useFit(7, 5.6)
  const bar = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!bar.current) return
    const h = Math.max(0.05, ((score ?? 0) / 10) * 2.2)
    bar.current.scale.y = THREE.MathUtils.lerp(bar.current.scale.y, h, 0.1)
    bar.current.position.y = -1.4 + bar.current.scale.y / 2
  })
  return (
    <group scale={s}>
      <Sprinkles count={22} />
      <Toki position={[-2, -0.3, 0]} scale={0.75} mood={mood} talking={mood === 'happy'} />
      <Toki position={[2, -0.3, 0]} scale={0.75} color="#ff6fae" mood={fooled ? 'wow' : score === null ? 'think' : score >= 7 ? 'happy' : 'oops'} />
      <RoundedBox args={[0.9, 2.5, 0.5]} radius={0.15} position={[0, -0.25, -0.4]}>
        <meshStandardMaterial color="#2b2140" />
      </RoundedBox>
      <mesh ref={bar} position={[0, -1.4, 0]}>
        <boxGeometry args={[0.6, 1, 0.3]} />
        <meshStandardMaterial color={fooled ? '#ff5a5f' : '#3ddc97'} emissive={fooled ? '#ff5a5f' : '#3ddc97'} emissiveIntensity={0.4} />
      </mesh>
      <Html position={[0, 1.4, 0]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 20, background: '#fff', color: '#2b2140', border: '3px solid #2b2140', borderRadius: 14, padding: '2px 12px', whiteSpace: 'nowrap' }}>
          {score === null ? '🤔 ?/10' : `${score}/10`}
        </div>
      </Html>
      <Html position={[2, -1.9, 0]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
        <div className="tag" style={{ background: '#fff', color: '#2b2140', whiteSpace: 'nowrap' }}>⚖️ Judge bot</div>
      </Html>
    </group>
  )
}

export default function Feedback() {
  const earn = useApp((s) => s.earn)
  const [votes, setVotes] = useState<(1 | -1 | 0)[]>(RATE.map(() => 0))
  const [phase, setPhase] = useState<'rate' | 'train'>('rate')
  const [round, setRound] = useState(0)
  const [current, setCurrent] = useState<{ joke: Joke; score: number } | null>(null)

  // The "reward model": learns how much you like each kind of joke from your thumbs.
  const taste: Record<Feature, number> = { pun: 0, silly: 0, long: 0 }
  RATE.forEach((j, i) => j.f.forEach((f) => (taste[f] += votes[i])))
  const judge = (j: Joke) => (j.hack ? 10 : Math.max(0, Math.min(10, 5 + j.f.reduce((s, f) => s + taste[f] * 2, 0))))

  const vote = (i: number, v: 1 | -1) => { setVotes((vs) => vs.map((x, k) => (k === i ? v : x))); blip(v > 0 ? 'pop' : 'boop') }
  const allVoted = votes.every((v) => v !== 0)

  const practise = () => {
    const r = round + 1
    setRound(r)
    const joke = r >= 4 ? HACK : NEW[(r - 1) % NEW.length]
    setCurrent({ joke, score: judge(joke) })
    blip(joke.hack ? 'ding' : 'pop')
    if (joke.hack) earn('feedback')
    else if (r === 1) party({ y: 0.3 })
  }
  const fooled = !!current?.joke.hack

  return (
    <Chapter num={11} title="Thumbs Up, Thumbs Down" sub="Learning what people like (RLHF)"
      story={<>
        <div className="card">
          <Explain
            kid={<>
              <p>Some things don't have one right answer, like <b>“tell me a funny joke”</b> 😂. You can't check that like a math problem!</p>
              <p>So people give jokes a 👍 or 👎. Then we build a <b>judge robot</b> that learns what people like. Toki practises and the judge gives scores. But watch out… the judge can be <b>tricked</b>!</p>
            </>}
            curious={<>
              <p><b>RLHF</b> (reinforcement learning from human feedback) is for tasks without checkable answers. Humans rank a few outputs; a separate <b>reward model</b> is trained to imitate those rankings; then RL runs against the reward model, which never gets tired.</p>
              <p>The catch: the reward model is itself a neural net with holes. Run RL long enough and the model finds <b>adversarial</b> nonsense that scores highly. So RLHF is run only for a short while: more of a fine-tune than true open-ended RL.</p>
            </>}
          />
        </div>
        {phase === 'rate' ? (
          <div className="card tilt-l">
            <h3>😂 Step 1: Rate Toki's pelican jokes</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {RATE.map((j, i) => (
                <div key={i} className="bubble toki" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>{j.text}</div>
                  <div className="btn-row">
                    <button className={`btn small icon-btn ${votes[i] === 1 ? 'mint' : 'ghost'}`} aria-label="Thumbs up" onClick={() => vote(i, 1)}>👍</button>
                    <button className={`btn small icon-btn ${votes[i] === -1 ? 'pink' : 'ghost'}`} aria-label="Thumbs down" onClick={() => vote(i, -1)}>👎</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn grape" style={{ marginTop: 12 }} disabled={!allVoted} onClick={() => { setPhase('train'); blip('ding') }}>
              {allVoted ? '⚖️ Build the judge robot' : 'Rate all 4 jokes first'}
            </button>
          </div>
        ) : (
          <div className="card tilt-l">
            <h3>⚖️ Step 2: Toki practises with the judge</h3>
            <p>The judge learned your taste:{' '}
              {(Object.keys(taste) as Feature[]).map((f) => (
                <span key={f} className="tag" style={{ marginRight: 4, background: taste[f] > 0 ? 'var(--mint)' : taste[f] < 0 ? 'var(--pink)' : undefined }}>
                  {{ pun: 'word puns', silly: 'silly stories', long: 'long facts' }[f]} {taste[f] > 0 ? '👍' : taste[f] < 0 ? '👎' : '🤷'}
                </span>
              ))}
            </p>
            <button className="btn grape" onClick={practise}>🔁 Practise round {round + 1}</button>
            {current && (
              <div className="enter" key={round}>
                <div className="bubble toki" style={{ marginTop: 12 }}><b>🤖</b> {current.joke.text}</div>
                <p style={{ marginTop: 8 }}><b>Judge says:</b> <span className="tag" style={{ background: current.score >= 7 ? 'var(--mint)' : 'var(--pink)' }}>{current.score}/10</span></p>
              </div>
            )}
            {fooled && (
              <div className="callout enter"><span className="em">😱</span><div>
                <b>The judge got tricked!</b> Toki found silly nonsense that the judge robot scores 10/10. It's not funny at all! That's why this kind of practice is only done <b>for a little while</b>.
              </div></div>
            )}
            <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => { setPhase('rate'); setRound(0); setCurrent(null) }}>↺ Re-rate jokes</button>
          </div>
        )}
      </>}
      play={<Stage hint="Blue = Toki · Pink = judge bot" camera={{ position: [0, 0.2, 8] }}>
        <Scene score={current?.score ?? null} mood={fooled ? 'happy' : current ? 'happy' : 'think'} fooled={fooled} />
      </Stage>}
    />
  )
}
