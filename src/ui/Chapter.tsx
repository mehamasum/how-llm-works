import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CHAPTERS } from '../chapters'
import { goTo, useChapterIndex } from '../nav'
import { useApp } from '../store'
import { blip } from '../sound'

export type Step = {
  title: string
  body: ReactNode
  /** Label for the Next button on this step. */
  next?: string
  /** Set to false to keep Next locked until the visitor has done the step's activity. */
  canNext?: boolean
  /** Shown next to a locked Next button. */
  lockedHint?: string
}

type Props = {
  title: string
  sub: string
  steps: Step[]
  /** The 3D stage side. Pass a function to reveal extra controls as the visitor reaches later steps. */
  play: ReactNode | ((step: number) => ReactNode)
  /** Called whenever the visitor moves to another step. */
  onStep?: (step: number) => void
}

// A chapter is a short walkthrough: one step card at a time beside the 3D stage.
// On phones the stage is pinned on top and the step card sits underneath it.
export function Chapter({ title, sub, steps, play, onStep }: Props) {
  const index = useChapterIndex()
  const info = CHAPTERS[index]
  const era = info.era
  const [step, setStep] = useState(0)
  const [seen, setSeen] = useState(0)
  const card = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    card.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    heading.current?.focus({ preventScroll: true })
  }, [step])

  const go = (s: number) => {
    blip('pop')
    setStep(s)
    onStep?.(s)
    setSeen((v) => Math.max(v, s))
  }

  const s = steps[step]
  const last = step === steps.length - 1

  return (
    <article className="enter">
      <header className="chapter-head">
        <div className="chapter-num">{index}</div>
        <div>
          <span className={`era-tag ${era}`}>{era === 'past' ? '📼 Flashback: building Toki' : info.part === 'Looking ahead' ? '🚀 Looking ahead' : '🔴 Now: answering you'}</span>
          <h1>{title}</h1>
          <div className="sub">{sub}</div>
        </div>
      </header>
      <div className="chapter-grid">
        <div className="story-col">
          <section ref={card} className="card step-card" aria-label={`Step ${step + 1} of ${steps.length}`}>
            <div className="step-top">
              <span className="step-pill">Step {step + 1} of {steps.length}</span>
              <div className="step-dots" role="tablist" aria-label="Steps">
                {steps.map((st, i) => (
                  <button key={i} role="tab" aria-selected={i === step} aria-label={`Step ${i + 1}: ${st.title}`} disabled={i > seen}
                    className={i === step ? 'on' : i <= seen ? 'seen' : ''} onClick={() => go(i)} />
                ))}
              </div>
            </div>
            <div key={step} className="step-body enter">
              {step === 0 && info.bridge && (
                <div className="bridge"><span className="em">🧵</span><div><b>Why we're here:</b> {info.bridge}</div></div>
              )}
              <h2 ref={heading} tabIndex={-1} className="step-title">{s.title}</h2>
              {s.body}
              {last && info.lesson && (
                <div className="big-idea"><span className="em">🔑</span><div><b>Big idea:</b> {info.lesson}</div></div>
              )}
            </div>
            <div className="step-nav">
              {step > 0 && <button className="btn ghost small" onClick={() => go(step - 1)}>◀ Back</button>}
              <div className="spacer" />
              {s.canNext === false && s.lockedHint && <span className="muted step-locked">{s.lockedHint}</span>}
              {last ? <NextChapter /> : (
                <button className="btn grape" disabled={s.canNext === false} onClick={() => go(step + 1)}>{s.next ?? 'Next'} ▶</button>
              )}
            </div>
          </section>
        </div>
        <div className="play-col">{typeof play === 'function' ? play(step) : play}</div>
      </div>
    </article>
  )
}

// The final step's button leads to the next chapter, and bounces once this chapter's sticker is earned.
function NextChapter() {
  const i = useChapterIndex()
  const done = useApp((s) => s.stickers.includes(CHAPTERS[i].id))
  const next = CHAPTERS[i + 1]
  if (!next) return null
  const backToNow = CHAPTERS[i].era === 'past' && next.era === 'now'
  return (
    <button className={`btn grape up-next-btn ${done ? 'ready' : ''}`} onClick={() => { blip('pop'); goTo(i + 1) }}>
      {done && '⭐ '}{backToNow ? '⏩ Back to now: ' : 'Next chapter: '}{next.emoji} {next.title} ▶
    </button>
  )
}
