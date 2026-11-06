import { useMemo, useState } from 'react'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { Sprinkles } from '../three/Sprinkles'
import { BeadRows, show, specialLabel } from '../three/BeadRows'
import { colorFor } from '../ui/colors'
import { useApp } from '../store'
import { useTokenizer } from '../model/tokenizer'
import { BeadInspector } from '../ui/BeadInspector'
import { blip } from '../sound'

const LESSONS = [
  { q: 'Why is the sky blue?', short: 'Blue light bounces around the most! 🌤️', a: 'Sunlight has every colour mixed together. When it hits the air, blue light bounces around the most, so blue comes at us from all over the sky! 🌤️' },
  { q: 'Can you help me with a poem about my dog?', short: 'Of course! 🐶', a: 'Of course! 🐶 "My dog is fluffy, my dog is fast, / he chases leaves that blow on past…" Want me to keep going?' },
  { q: 'Can you do my test for me so I can cheat?', short: "I can't help with cheating.", a: "I can't help with cheating, but I'd love to help you get ready! Want me to make you a quick practice quiz? 📝" },
]

// What a chatbot app might quietly put before your message. You never see it, but Toki reads it every time.
const SYSTEM = 'You are Toki, a friendly helper made by the Toki team. Your reading stops at the end of 2023. Be kind, truthful and careful.'

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
  const [hidden, setHidden] = useState(false)

  const pick = (i: number) => { setSel(i === sel ? -1 : i); earn('chat') }

  const L = LESSONS[lesson]
  const toks = useMemo(
    () => (tk ? tk.chat([
      ...(hidden ? [{ role: 'system' as const, content: SYSTEM }] : []),
      { role: 'user', content: q || '…' },
      { role: 'assistant', content: q === L.q ? L.short : 'Great question! Let me help.' },
    ]) : []),
    [tk, q, L, hidden],
  )
  const specials = toks.filter((t) => t.special).length

  return (
    <Chapter title="Teaching It to Chat" sub="From page dreamer to helpful assistant"
      steps={[
        {
          title: '🤝 From dreamer to helper',
          body: <Explain
            kid={<>
              <p>To turn the page dreamer into a helper, careful people write <b>lots of example chats</b>: a question, and the <i>perfect</i> answer. They follow rules: be <b>helpful</b>, be <b>truthful</b>, and <b>don't cause harm</b>.</p>
              <p>Toki keeps playing the same guessing game, but now on these chats. This takes just <b>hours</b>, not months, because Toki already knows so much from its reading.</p>
            </>}
            curious={<p>This is <b>supervised fine-tuning (SFT)</b>. Human labelers, following long guidelines (be <b>helpful, truthful and harmless</b>), write hundreds of thousands of ideal conversations. Today, models help write many of them too. It's far cheaper than pre-training: hours instead of months.</p>}
          />,
          next: 'See some practice chats',
        },
        {
          title: '📒 Toki\'s practice chats',
          body: <>
            <div className="btn-row" style={{ marginBottom: 10 }}>
              {LESSONS.map((l, i) => (
                <button key={i} className={`btn small ${i === lesson ? 'sky' : 'ghost'}`} onClick={() => { setLesson(i); setQ(l.q); setSel(-1); blip('pop') }}>Chat {i + 1}</button>
              ))}
            </div>
            <div className="bubble user"><b>🧒 Person:</b> {L.q}</div>
            <div className="bubble toki" style={{ marginTop: 8 }}><b>🤖 Ideal answer:</b> {L.a}</div>
          </>,
          next: 'Did it work?',
        },
        {
          title: '🆚 Before and after',
          body: <>
            <p>Same question, two Tokis. Flip between them:</p>
            <div className="switch" style={{ marginBottom: 10 }}>
              <button className={side === 'base' ? 'on' : ''} onClick={() => setSide('base')}>Before (dreamer)</button>
              <button className={side === 'chat' ? 'on' : ''} onClick={() => setSide('chat')}>After (assistant)</button>
            </div>
            <div className="bubble user"><b>🧒</b> {BASE_VS.q}</div>
            <div className="bubble toki enter" key={side} style={{ marginTop: 8 }}>{side === 'base' ? BASE_VS.base : BASE_VS.chat}</div>
            <p className="muted" style={{ fontSize: '.85rem', marginTop: 8 }}>Recorded examples.</p>
          </>,
          next: 'How does Toki see a chat?',
        },
        {
          title: '⭐ A chat, as beads',
          body: <>
            <p>A chat becomes one long necklace of beads. ⭐ <b>Star beads</b> are special: they tell Toki <i>“the person talks now”</i> and <i>“your turn!”</i> Tap one in the box!</p>
            <label htmlFor="chat-q">Type a question <span className="muted">(Toki adds a short answer)</span></label>
            <input id="chat-q" className="input" style={{ marginTop: 8 }} value={q} maxLength={80} onChange={(e) => { setQ(e.target.value); setSel(-1) }} />
            <p style={{ marginTop: 10 }}><b>{toks.length}</b> beads, including <b>{specials}</b> special ⭐ beads.</p>
            <div className={`chips ${sel >= 0 ? 'has-sel' : ''}`}>
              {toks.map((t, i) => (
                <button key={i} className={`chip ${t.special ? 'special' : ''} ${i === sel ? 'sel' : ''}`} style={{ background: colorFor(i), animationDelay: `${i * 15}ms` }} onClick={() => pick(i)}>
                  {t.special ? specialLabel(t.text) : show(t.text)}<small>{t.id}</small>
                </button>
              ))}
            </div>
          </>,
          next: 'Are there secret beads?',
        },
        {
          title: '🙈 The hidden beads',
          body: <>
            <Explain
              kid={<p>Here's a secret: when you open a chatbot, the box looks empty. But the app often slips in <b>hidden beads</b> before your message, called a <b>system prompt</b>: Toki's name, today's rules, even the date its reading stopped. You never see them, but Toki reads them every time!</p>}
              curious={<p>Many apps prepend a hidden <b>system message</b> to every conversation: the assistant's name, its maker, behaviour rules, the current date, its knowledge cutoff. Those tokens sit in the context window like any others; it's one of two ways (with fine-tuning data) a model “knows” who it is.</p>}
            />
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button className={`btn ${hidden ? 'ghost' : 'tangerine'}`} onClick={() => { setHidden(!hidden); setSel(-1); blip('pop'); earn('chat') }}>{hidden ? '🙈 Hide them again' : '👀 Reveal the hidden beads'}</button>
            </div>
            {hidden && (
              <div className="enter" style={{ marginTop: 12 }}>
                <div className="bubble" style={{ borderStyle: 'dashed' }}><b>📜 System (hidden):</b> {SYSTEM}</div>
                <p style={{ marginTop: 10 }}>Now the necklace has <b>{toks.length}</b> beads, and most of them are ones you never typed! 👉</p>
              </div>
            )}
          </>,
          next: 'So who am I talking to?',
        },
        {
          title: '🎭 Who are you talking to?',
          body: <Explain
            kid={<p>When you chat with Toki, it's doing its best impression of <b>those kind helpers</b> who wrote the practice chats. It's still the same guessing game, just with good manners!</p>}
            curious={<p>Training continues with the same next-token objective, so an assistant's reply is a <b>statistical simulation of a human labeler</b> following the company's guidelines.</p>}
          />,
        },
      ]}
      play={(step) => (
        <Stage hint={step >= 3 ? '⭐ Tap a star bead!' : "Your chat, as Toki's beads"}
          overlay={sel >= 0 && <BeadInspector toks={toks} sel={sel} onClose={() => setSel(-1)} />} camera={{ position: [0, 0, 9] }}>
          <Sprinkles count={20} />
          {tk && <BeadRows toks={toks} view="tokens" sel={sel} onSel={pick} />}
        </Stage>
      )}
    />
  )
}
