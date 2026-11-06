import { useMemo, useState } from 'react'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { BeadRows, show, type View } from '../three/BeadRows'
import { Sprinkles } from '../three/Sprinkles'
import { colorFor } from '../ui/colors'
import { useApp } from '../store'
import { useTokenizer } from '../model/tokenizer'
import { BeadInspector } from '../ui/BeadInspector'
import { blip } from '../sound'

const PRESETS = ['strawberry', 'Unbelievable!', 'I ❤️ 🍕', '1234567 + 89', 'supercalifragilistic']

export default function Tokens() {
  const { sentence: yours, earn } = useApp()
  // A local copy: playing with words here must not overwrite the sentence the visitor typed on the first screen.
  const [sentence, setSentence] = useState(yours)
  const tk = useTokenizer()
  const [view, setView] = useState<View>('letters')
  const [sel, setSel] = useState(-1)
  const toks = useMemo(() => (tk ? tk.tokenize(sentence) : []), [tk, sentence])
  const letters = [...sentence].length
  const bytes = useMemo(() => [...new TextEncoder().encode(sentence)], [sentence])

  const pick = (i: number) => { setSel(i === sel ? -1 : i); blip('tick'); earn('tokens') }
  // Step 1 shows letters, step 2 lets the visitor flip, and later steps work with token beads.
  const viewAt = (step: number): View => (step === 0 ? 'letters' : step === 1 ? view : 'tokens')
  const switcher = (
    <div className="switch">
      <button className={view === 'letters' ? 'on' : ''} onClick={() => setView('letters')}>Letters</button>
      <button className={view === 'tokens' ? 'on' : ''} onClick={() => { setView('tokens'); blip('pop') }}>Tokens</button>
    </div>
  )
  const counts = (
    <div className="grid-2" style={{ marginTop: 12 }}>
      <div className="callout"><span className="em">🔤</span><div><div className="big-num">{letters}</div>letters</div></div>
      <div className="callout"><span className="em">🍬</span><div><div className="big-num">{toks.length}</div>token beads</div></div>
    </div>
  )

  return (
    <Chapter title="Words → Token Beads" sub="Toki doesn't see letters. It sees beads!"
      steps={[
        {
          title: '🔤 Borrowing your sentence',
          body: <>
            <p>Builders chop <b>all</b> the internet's text into beads. Let's borrow your sentence to see how:</p>
            <div className="bubble user">{sentence}</div>
            <Explain
              kid={<p style={{ marginTop: 12 }}>Inside a computer, every letter is already a <b>number</b>. Here are the first few. So your sentence is a long necklace of <b>{bytes.length} little number beads</b>. That's a lot for Toki to read!</p>}
              curious={<p style={{ marginTop: 12 }}>Text is first stored as bytes (UTF-8): 256 possible symbols. Your sentence is <b>{bytes.length} bytes</b>, so it would be a sequence of {bytes.length} symbols.</p>}
            />
            <div className="chips">
              {bytes.slice(0, 16).map((b, i) => (
                <span key={i} className="chip" style={{ background: '#fff6e5' }}>{b < 128 ? show(String.fromCharCode(b)) : '◦'}<small>{b}</small></span>
              ))}
              {bytes.length > 16 && <span className="chip" style={{ background: '#fff6e5' }}>…<small>+{bytes.length - 16}</small></span>}
            </div>
          </>,
          next: 'Squish them together',
        },
        {
          title: '🍬 Squish letters into tokens',
          body: <>
            <Explain
              kid={<>
                <p>Toki can only read a <b>limited number of beads at once</b>, so a shorter necklace is better. Letters that often appear together get squished into one bigger bead, called a <b>token</b>.</p>
                <p>Common chunks like <code>·the</code> or <code>·cat</code> become one bead. (The <code>·</code> dot is a space!)</p>
              </>}
              curious={<p>Sequence length is a precious resource for the network, so we trade a bigger vocabulary for shorter sequences. <b>Byte Pair Encoding</b> repeatedly merges the most common neighbouring pair into a new symbol. GPT-4o's tokenizer ends up with about <b>200,000</b> token types.</p>}
            />
            <p><b>Flip the switch</b> and watch the beads squish 👇</p>
            {switcher}
            {counts}
          </>,
          next: 'What are the numbers?',
        },
        {
          title: '🔢 Every bead is a number',
          body: <>
            <p>Each token bead has its own <b>number</b>. These numbers are <b>all Toki ever sees</b>!</p>
            <p><b>👆 Tap a bead</b> in the box or below to see its number.</p>
            {!tk ? <p className="muted">Loading the real tokenizer…</p> : (
              <div className={`chips ${sel >= 0 ? 'has-sel' : ''}`}>
                {toks.map((t, i) => (
                  <button key={i} className={`chip ${i === sel ? 'sel' : ''}`} style={{ background: colorFor(i), animationDelay: `${i * 20}ms` }} onClick={() => pick(i)}>
                    {show(t.text)}<small>{t.id}</small>
                  </button>
                ))}
              </div>
            )}
          </>,
          canNext: sel >= 0,
          lockedHint: '👆 Tap a bead first',
          next: 'Try your own words',
        },
        {
          title: '✏️ Try your own words',
          body: <>
            <label htmlFor="tok-in">Type anything, or tap an idea:</label>
            <textarea id="tok-in" className="input" rows={2} style={{ marginTop: 8, resize: 'vertical' }} value={sentence} maxLength={240}
              onChange={(e) => { setSentence(e.target.value); setSel(-1) }} />
            <div className="btn-row" style={{ marginTop: 8 }}>
              {PRESETS.map((p) => <button key={p} className="btn ghost small" onClick={() => { setSentence(p); setSel(-1) }}>{p}</button>)}
            </div>
            {counts}
          </>,
          next: 'One more surprise',
        },
        {
          title: '🤯 Same word, different beads',
          body: <>
            <p>For us, <b>hello</b>, <b>Hello</b> and <b>HELLO</b> are the same word. Are they the same for Toki?</p>
            <button className="btn pink" onClick={() => { setSentence('hello Hello HELLO'); setSel(-1); blip('pop') }}>Show me!</button>
            {sentence === 'hello Hello HELLO' && (
              <div className="callout enter" style={{ marginTop: 12 }}>
                <span className="em">💡</span>
                <div>Different beads with different numbers! Toki has to <i>learn</i> they mean the same thing. That's one reason AI can be weird with spelling.</div>
              </div>
            )}
          </>,
        },
      ]}
      play={(step) => (
        <Stage hint={step >= 2 ? '👆 Tap a bead to see its number' : step === 1 ? 'Flip Letters → Tokens!' : `${letters} letter beads`}
          overlay={sel >= 0 && step >= 2 && <BeadInspector toks={toks} sel={sel} onClose={() => setSel(-1)} />}
          badge={step === 1 ? switcher : undefined}>
          <Sprinkles count={20} />
          {tk && <BeadRows toks={toks} view={viewAt(step)} sel={step >= 2 ? sel : -1} onSel={pick} />}
        </Stage>
      )}
    />
  )
}
