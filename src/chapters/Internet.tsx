import { useFrame } from '@react-three/fiber'
import { RoundedBox, Html } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { useFit } from '../three/useFit'
import { PALETTE } from '../ui/colors'
import { useApp } from '../store'
import { party } from '../ui/confetti'
import { blip } from '../sound'

type Doc = { text: string; keep: boolean; why: string; emoji: string }
const DOCS: Doc[] = [
  { emoji: '🍅', text: 'How to grow tomatoes: dig a small hole, add the seed, water it every day…', keep: true, why: 'Helpful, well-written knowledge. Keep!' },
  { emoji: '💸', text: 'BUY CHEAP WATCHES!!! CLICK HERE CLICK HERE WIN WIN WIN', keep: false, why: 'Spam! Sites like this are blocked by the URL filter.' },
  { emoji: '🌙', text: 'The Moon goes around the Earth about once every 27 days.', keep: true, why: 'A true fact. Great for learning!' },
  { emoji: '🧩', text: "<div class='menu'><a href='/home'>Home</a><script>track()</script>", keep: false, why: 'Website code, not words. Text extraction throws the code away and keeps only the readable text.' },
  { emoji: '📞', text: 'My name is Sam, my phone number is 555-0134 and I live at 12 Oak Street.', keep: false, why: 'Personal information! It gets removed to protect people’s privacy.' },
  { emoji: '🌱', text: 'Plants make their own food from sunlight, water and air. This is called photosynthesis.', keep: true, why: 'Science! Keep it.' },
  { emoji: '🥖', text: 'La tour Eiffel se trouve à Paris et mesure 330 mètres.', keep: false, why: 'This dataset (FineWeb) keeps pages that are mostly English. Other datasets keep more languages!' },
  { emoji: '🙃', text: 'asdf qwer zxcv lorem lorem lorem ipsum ipsum ????', keep: false, why: 'Junk with no meaning. Quality filters drop it.' },
]

type Page = { pos: THREE.Vector3; vel: THREE.Vector3; good: boolean; color: string; spin: number; t: number }

function Funnel({ kept, onCount }: { kept: number; onCount: () => void }) {
  const s = useFit(7, 8)
  const profile = useMemo(() => {
    const pts: THREE.Vector2[] = []
    for (let i = 0; i <= 20; i++) {
      const y = i / 20
      pts.push(new THREE.Vector2(0.35 + Math.pow(y, 1.8) * 1.9, y * 2.2 - 1.1))
    }
    return pts
  }, [])
  const pages = useRef<Page[]>(
    Array.from({ length: 14 }, (_, i) => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 3, 3 + i * 0.6, (Math.random() - 0.5) * 0.8),
      vel: new THREE.Vector3(),
      good: Math.random() > 0.45,
      color: PALETTE[i % PALETTE.length],
      spin: Math.random() * 3,
      t: 0,
    })),
  )
  const meshes = useRef<(THREE.Group | null)[]>([])
  const drive = useRef<THREE.Mesh>(null)
  const glow = useRef(0)

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    pages.current.forEach((p, i) => {
      const m = meshes.current[i]
      if (!m) return
      p.t += dt
      if (p.pos.y > 1.3 || (!p.good && p.vel.x !== 0)) {
        p.pos.y -= dt * 1.4
        if (!p.good && p.pos.y < 1.5 && p.vel.x === 0) p.vel.set(p.pos.x >= 0 ? 3 : -3, 2, 0)
        p.pos.addScaledVector(p.vel, dt)
        p.vel.y -= dt * 6
      } else if (p.good) {
        // swirl down the funnel
        p.pos.x = THREE.MathUtils.lerp(p.pos.x, 0, dt * 3)
        p.pos.z = THREE.MathUtils.lerp(p.pos.z, 0, dt * 3)
        p.pos.y -= dt * 1.8
        if (p.pos.y < -2.2) { glow.current = 1; onCount() ; respawn(p) }
      }
      if (p.pos.y < -5 || Math.abs(p.pos.x) > 7) respawn(p)
      m.position.copy(p.pos)
      m.rotation.set(Math.sin(p.t * 2) * 0.3, p.t * p.spin, p.vel.x ? p.t * 6 : Math.sin(p.t) * 0.3)
      const sc = p.good && p.pos.y < 1.3 ? THREE.MathUtils.clamp((p.pos.y + 2.4) / 2.6, 0.2, 1) : 1
      m.scale.setScalar(sc)
    })
    glow.current = Math.max(0, glow.current - dt * 2)
    if (drive.current) (drive.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + glow.current
  })

  function respawn(p: Page) {
    p.pos.set((Math.random() - 0.5) * 3.2, 3.2 + Math.random() * 2, (Math.random() - 0.5) * 0.8)
    p.vel.set(0, 0, 0)
    p.good = Math.random() > 0.45
  }

  return (
    <group scale={s}>
      <Sprinkles count={24} />
      {pages.current.map((p, i) => (
        <group key={i} ref={(el) => { meshes.current[i] = el }}>
          <RoundedBox args={[0.55, 0.7, 0.05]} radius={0.04}>
            <meshStandardMaterial color={p.good ? '#ffffff' : '#ffd6d6'} />
          </RoundedBox>
          {[0.18, 0.05, -0.08, -0.21].map((y, k) => (
            <mesh key={k} position={[0, y, 0.03]}>
              <planeGeometry args={[k === 3 ? 0.25 : 0.4, 0.05]} />
              <meshBasicMaterial color={p.color} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.1, 0]}>
        <latheGeometry args={[profile, 48]} />
        <meshStandardMaterial color="#9b5de5" side={THREE.DoubleSide} transparent opacity={0.55} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.25, 0.08, 12, 64]} />
        <meshStandardMaterial color="#ffc93c" />
      </mesh>
      <RoundedBox ref={drive} args={[2.2, 0.8, 1.2]} radius={0.2} position={[0, -2.5, 0]}>
        <meshStandardMaterial color="#3ddc97" emissive="#3ddc97" emissiveIntensity={0.2} />
      </RoundedBox>
      <Html position={[0, -2.5, 0.7]} center zIndexRange={[1, 0]}>
        <div className="tag" style={{ background: '#fff', color: '#2b2140', whiteSpace: 'nowrap' }}>💾 {kept.toLocaleString()} pages</div>
      </Html>
    </group>
  )
}

export default function Internet() {
  const earn = useApp((s) => s.earn)
  const [kept, setKept] = useState(0)
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState<null | boolean>(null)
  const [score, setScore] = useState(0)
  const doc = DOCS[idx]
  const finished = idx >= DOCS.length

  const choose = (keep: boolean) => {
    if (answer !== null) return
    const right = keep === doc.keep
    setAnswer(right)
    if (right) { setScore((s) => s + 1); blip('pop') } else blip('boop')
  }
  const next = () => {
    setAnswer(null)
    const n = idx + 1
    setIdx(n)
    if (n >= DOCS.length) { earn('internet'); party() }
  }

  return (
    <Chapter num={1} title="Read the Internet" sub="Step one: collect a mountain of text"
      story={<>
        <div className="card">
          <Explain
            kid={<>
              <p>To learn to talk, Toki first needs <b>lots and lots of reading</b>. So the builders download millions of web pages 🌍.</p>
              <p>But the internet is messy! There's spam, computer code, and people's private info. So everything goes through a <b>giant funnel of filters</b> that keeps only the good stuff.</p>
            </>}
            curious={<>
              <p>Pre-training starts with a huge crawl of public web pages (e.g. Common Crawl). Hugging Face's <b>FineWeb</b> dataset is a good public example of what companies build internally.</p>
              <p>The pipeline: <b>URL filtering</b> (block spam/malware/adult sites) → <b>text extraction</b> (strip HTML) → <b>language filtering</b> (FineWeb keeps pages that are &gt;65% English) → dedup & quality filters → <b>PII removal</b>.</p>
            </>}
          />
          <div className="grid-2" style={{ marginTop: 10 }}>
            <div className="callout"><span className="em">💾</span><div><div className="big-num">44 TB</div>That's FineWeb after filtering. It fits on one big hard drive!</div></div>
            <div className="callout"><span className="em">📚</span><div><div className="big-num">15 trillion</div>little word-pieces (tokens) of text.</div></div>
          </div>
        </div>
        <div className="card tilt-r">
          <h3>🧹 Be the filter!</h3>
          {!finished ? (
            <>
              <p className="muted">Page {idx + 1} of {DOCS.length} · Should this page go into Toki's reading pile?</p>
              <div className={`bubble ${answer === false ? 'shake' : ''}`} style={{ fontFamily: doc.text.startsWith('<') ? 'ui-monospace, monospace' : undefined }}>
                <span style={{ fontSize: '1.5rem', marginRight: 8 }}>{doc.emoji}</span>{doc.text}
              </div>
              {answer === null ? (
                <div className="btn-row" style={{ marginTop: 12 }}>
                  <button className="btn mint" onClick={() => choose(true)}>👍 Keep</button>
                  <button className="btn pink" onClick={() => choose(false)}>🗑️ Toss</button>
                </div>
              ) : (
                <div className="callout enter" style={{ marginTop: 12 }}>
                  <span className="em">{answer ? '🎉' : '🤔'}</span>
                  <div><b>{answer ? 'Yes!' : 'Not quite.'}</b> {doc.why}
                    <div style={{ marginTop: 8 }}><button className="btn small" onClick={next}>Next page ▶</button></div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="enter">
              <p className="big-num">{score} / {DOCS.length} ⭐</p>
              <p>You're a great filter! Real filters do this <b>automatically</b> for billions of pages.</p>
              <button className="btn small ghost" onClick={() => { setIdx(0); setScore(0) }}>Play again</button>
            </div>
          )}
        </div>
      </>}
      play={<Stage hint="Good pages go in · junk gets bounced!" camera={{ position: [0, 0.3, 9] }}>
        <Funnel kept={kept} onCount={() => setKept((k) => k + 1)} />
      </Stage>}
    />
  )
}
