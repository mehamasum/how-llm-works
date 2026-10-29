import { useEffect, useMemo, useState } from 'react'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { BeadRows, show, specialLabel } from '../three/BeadRows'
import { colorFor } from '../ui/colors'
import { useApp } from '../store'
import { useTokenizer } from '../model/tokenizer'
import { blip } from '../sound'

const LESSONS = [
  { q: 'Why is the sky blue?', short: 'Blue light bounces around the most! 🌤️', a: 'Sunlight has every colour mixed together. When it hits the air, blue light bounces around the most, so blue comes at us from all over the sky! 🌤️' },
  { q: 'Can you help me with a poem about my dog?', short: 'Of course! 🐶', a: 'Of course! 🐶 "My dog is fluffy, my dog is fast, / he chases leaves that blow on past…" Want me to keep going?' },
  { q: 'Can you do my test for me so I can cheat?', short: "I can't help with cheating.", a: "I can't help with cheating, but I'd love to help you get ready! Want me to make you a quick practice quiz? 📝" },
]

const BASE_VS = {
  q: 'Why is the sky blue?',
  base: 'Why is the sky blue? Why is grass green? Why do cats purr? 10 questions kids ask that will totally stump their parents! Number 7 will surprise you…',
  chat: LESSONS[0].a,
}

export default function Chat() {
  const earn = useApp((s) => s.earn)
  const tk = useTokenizer()
  const [q, setQ] = useState('Why is the sky blue?')
  const [lesson, setLesson] = useState(0)
  const [sel, setSel] = useState(-1)
  const [side, setSide] = useState<'base' | 'chat'>('chat')

  useEffect(() => { earn('chat') }, [earn])

  const L = LESSONS[lesson]
  const toks = useMemo(
    () => (tk ? tk.chat([{ role: 'user', content: q || '…' }, { role: 'assistant', content: q === L.q ? L.short : 'Here is my answer!' }]) : []),
    [tk, q, L],
  )
  const specials = toks.filter((t) => t.special).length

  return (
    <Chapter num={6} title="Teaching It to Chat" sub="From page dreamer to helpful assistant"
      story={<>
        <div className="card">
          <Explain
            kid={<>
              <p>To turn the dreamer into a helper, people write <b>lots of example chats</b>: a question, and the <i>perfect</i> helpful answer ✍️.</p>
              <p>Toki then keeps practising its guessing game — but now on these chats. Soon it learns to <b>talk like a kind, helpful assistant</b>!</p>
            </>}
            curious={<>
              <p>This is <b>supervised fine-tuning (SFT)</b>. Human labelers, following long guidelines (be <b>helpful, truthful and harmless</b>), write hundreds of thousands of ideal conversations. Today, models help write many of them too.</p>
              <p>Training continues on this new data, with the same next-token objective. Conversations are flattened into one token stream using <b>special tokens</b> that mark who is speaking. When you chat with an assistant, you are getting a statistical simulation of those labelers.</p>
            </>}
          />
        </div>
        <div className="card tilt-l">
          <h3>📒 Toki's practice chats</h3>
          <div className="btn-row" style={{ marginBottom: 10 }}>
            {LESSONS.map((l, i) => (
              <button key={i} className={`btn small ${i === lesson ? 'sky' : 'ghost'}`} onClick={() => { setLesson(i); setQ(l.q); setSel(-1); blip('pop') }}>Chat {i + 1}</button>
            ))}
          </div>
          <div className="bubble user"><b>🧒 Person:</b> {L.q}</div>
          <div className="bubble toki" style={{ marginTop: 8 }}><b>🤖 Ideal answer:</b> {L.a}</div>
        </div>
        <div className="card tilt-r">
          <h3>🆚 Same question, two Tokis</h3>
          <div className="switch" style={{ marginBottom: 10 }}>
            <button className={side === 'base' ? 'on' : ''} onClick={() => setSide('base')}>Before (dreamer)</button>
            <button className={side === 'chat' ? 'on' : ''} onClick={() => setSide('chat')}>After (assistant)</button>
          </div>
          <div className="bubble user"><b>🧒</b> {BASE_VS.q}</div>
          <div className="bubble toki enter" key={side} style={{ marginTop: 8 }}>{side === 'base' ? BASE_VS.base : BASE_VS.chat}</div>
          <p className="muted" style={{ fontSize: '.85rem', marginTop: 8 }}>Recorded examples.</p>
        </div>
      </>}
      play={<>
        <Stage hint="⭐ Star beads = special 'who's talking' tokens" camera={{ position: [0, 0, 9] }}>
          <Sprinkles count={20} />
          {tk && <BeadRows toks={toks} view="tokens" sel={sel} onSel={(i) => setSel(i === sel ? -1 : i)} />}
        </Stage>
        <div className="card" style={{ marginTop: 14 }}>
          <label htmlFor="chat-q"><b>Type a question to see the chat as Toki sees it</b> <span className="muted">(with a short answer)</span></label>
          <input id="chat-q" className="input" style={{ marginTop: 8 }} value={q} maxLength={80} onChange={(e) => { setQ(e.target.value); setSel(-1) }} />
          <p style={{ marginTop: 10 }}>
            <b>{toks.length}</b> beads, including <b>{specials}</b> special ⭐ beads. Special beads tell Toki <i>“the person talks now”</i> and <i>“your turn!”</i>
          </p>
          <div className="chips">
            {toks.map((t, i) => (
              <button key={i} className={`chip ${t.special ? 'special' : ''} ${i === sel ? 'sel' : ''}`} style={{ background: colorFor(i), animationDelay: `${i * 15}ms` }} onClick={() => setSel(i)}>
                {t.special ? specialLabel(t.text) : show(t.text)}<small>{t.id}</small>
              </button>
            ))}
          </div>
        </div>
      </>}
    />
  )
}
