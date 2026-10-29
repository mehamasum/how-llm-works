import { useEffect, useMemo, useState } from 'react'
import { Chapter } from '../ui/Chapter'
import { Explain } from '../ui/Explain'
import { Stage } from '../three/Stage'
import { BeadRows, show, type View } from '../three/BeadRows'
import { Sprinkles } from '../three/Sprinkles'
import { colorFor } from '../ui/colors'
import { useApp } from '../store'
import { useTokenizer } from '../model/tokenizer'
import { blip } from '../sound'

const PRESETS = ['strawberry', 'Unbelievable!', 'hello Hello HELLO', 'I ❤️ 🍕', '1234567 + 89', 'supercalifragilistic']

export default function Tokens() {
  const { sentence, setSentence, earn } = useApp()
  const tk = useTokenizer()
  const [view, setView] = useState<View>('tokens')
  const [sel, setSel] = useState(-1)
  const toks = useMemo(() => (tk ? tk.tokenize(sentence) : []), [tk, sentence])
  const letters = [...sentence].length

  useEffect(() => { earn('tokens') }, [earn])
  const pick = (i: number) => { setSel(i === sel ? -1 : i); blip('tick') }

  return (
    <Chapter num={2} title="Words → Token Beads" sub="Toki doesn't see letters. It sees beads!"
      story={<>
        <div className="card">
          <Explain
            kid={<>
              <p>Computers love numbers, not letters. So text gets chopped into little pieces called <b>tokens</b> 🍬, and each piece gets a <b>number</b>.</p>
              <p>Common chunks like <code>·the</code> or <code>·cat</code> become one bead. Rare words get split into several beads. (The <code>·</code> dot is a space!)</p>
            </>}
            curious={<>
              <p>Text is first turned into bytes (256 possible symbols). That makes sequences very long, so the <b>Byte Pair Encoding</b> algorithm repeatedly merges the most common neighbouring pair into a new symbol.</p>
              <p>GPT-4o's tokenizer ends up with about <b>200,000</b> token types. Your text becomes a list of token IDs — that list is all the model ever sees.</p>
            </>}
          />
        </div>
        <div className="card tilt-l">
          <label htmlFor="tok-in"><b>Type anything</b></label>
          <textarea id="tok-in" className="input" rows={2} style={{ marginTop: 8, resize: 'vertical' }} value={sentence} maxLength={240}
            onChange={(e) => { setSentence(e.target.value); setSel(-1) }} />
          <div className="btn-row" style={{ marginTop: 8 }}>
            {PRESETS.map((p) => <button key={p} className="btn ghost small" onClick={() => { setSentence(p); setSel(-1) }}>{p}</button>)}
          </div>
          <div className="grid-2" style={{ marginTop: 14 }}>
            <div className="callout"><span className="em">🔤</span><div><div className="big-num">{letters}</div>letters</div></div>
            <div className="callout"><span className="em">🍬</span><div><div className="big-num">{toks.length}</div>token beads</div></div>
          </div>
          <h4 style={{ marginTop: 16 }}>Your token numbers {sel >= 0 && <span className="muted">· bead #{sel + 1} selected</span>}</h4>
          {!tk ? <p className="muted">Loading the real tokenizer…</p> : (
            <div className="chips">
              {toks.map((t, i) => (
                <button key={i} className={`chip ${i === sel ? 'sel' : ''}`} style={{ background: colorFor(i), animationDelay: `${i * 20}ms` }} onClick={() => pick(i)}>
                  {show(t.text)}<small>{t.id}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="callout">
          <span className="em">💡</span>
          <div>Try <b>hello Hello HELLO</b>. Same word for us, but different beads for Toki! That's one reason AI can be weird with spelling.</div>
        </div>
      </>}
      play={<>
        <Stage hint="Tap a bead to see its number" badge={
          <div className="switch">
            <button className={view === 'letters' ? 'on' : ''} onClick={() => setView('letters')}>Letters</button>
            <button className={view === 'tokens' ? 'on' : ''} onClick={() => setView('tokens')}>Tokens</button>
          </div>
        }>
          <Sprinkles count={20} />
          {tk && <BeadRows toks={toks} view={view} sel={sel} onSel={pick} />}
        </Stage>
        <p className="muted" style={{ marginTop: 10, textAlign: 'center' }}>
          Flip <b>Letters → Tokens</b> to watch {letters} letters squish into {toks.length} beads.
        </p>
      </>}
    />
  )
}
