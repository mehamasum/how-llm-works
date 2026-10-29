import { Suspense, useEffect, useState } from 'react'
import { CHAPTERS } from './chapters'
import { goTo, useChapterIndex } from './nav'
import { useApp } from './store'
import { ModeSwitch } from './ui/Explain'
import { blip } from './sound'
import { Oops } from './ui/Oops'

export default function App() {
  const i = useChapterIndex()
  const ch = CHAPTERS[i]
  const [map, setMap] = useState(false)
  const { sound, toggleSound, stickers } = useApp()

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', ch.accent)
    document.title = `${ch.title} · How Chatbots Think`
  }, [ch])

  const nav = (d: number) => { blip('pop'); goTo(i + d) }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => goTo(0)} aria-label="Back to start">
          <span className="logo">🤖</span>
          <span className="name">How Chatbots Think</span>
        </button>
        <div className="spacer" />
        <div className="progress-dots" aria-hidden>
          {CHAPTERS.map((c, j) => (
            <span key={c.id} className={j === i ? 'on' : stickers.includes(c.id) ? 'done' : ''} />
          ))}
        </div>
        <ModeSwitch />
        <button className="btn ghost icon-btn small" onClick={toggleSound} aria-label={sound ? 'Mute sounds' : 'Turn sounds on'} title="Sounds">
          {sound ? '🔊' : '🔇'}
        </button>
      </header>

      <main className="main">
        <Oops key={ch.id}>
          <Suspense fallback={<div className="stage-loading" style={{ minHeight: '50vh' }}>🍬 unwrapping…</div>}>
            <ch.Component />
          </Suspense>
        </Oops>
      </main>

      <nav className="bottom-nav" aria-label="Chapters">
        <button className="btn ghost navbtn" onClick={() => nav(-1)} disabled={i === 0} aria-label="Previous chapter">
          ◀ <span className="txt">Back</span>
        </button>
        <button className="btn sky navbtn" onClick={() => setMap(true)} aria-label="Open chapter map">
          🗺️ <span className="txt">{i + 1} / {CHAPTERS.length}</span>
        </button>
        <div className="label">{ch.emoji} {ch.title}</div>
        <button className="btn navbtn" onClick={() => nav(1)} disabled={i === CHAPTERS.length - 1} aria-label="Next chapter">
          <span className="txt">Next</span> ▶
        </button>
      </nav>

      {map && (
        <div className="overlay" onClick={() => setMap(false)} role="dialog" aria-modal="true" aria-label="Chapter map">
          <div className="card map-panel enter" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, flex: 1 }}>🗺️ Adventure map</h2>
              <span className="sticker">⭐ {stickers.length} stickers</span>
              <button className="btn ghost icon-btn small" style={{ marginLeft: 10 }} onClick={() => setMap(false)} aria-label="Close map">✕</button>
            </div>
            {[...new Set(CHAPTERS.map((c) => c.part))].map((part) => (
              <section key={part} style={{ marginBottom: 14 }}>
                <h4 className="muted" style={{ margin: '6px 0' }}>{part}</h4>
                <div className="map-grid">
                  {CHAPTERS.map((c, j) => c.part === part && (
                    <button key={c.id} className={`island ${j === i ? 'current' : ''}`} style={{ background: `color-mix(in srgb, ${c.accent} 18%, var(--card))` }}
                      onClick={() => { setMap(false); goTo(j) }}>
                      <span className="em">{c.emoji}</span>
                      <span><b>{j + 1}. {c.title}</b><br /><small className="muted">{c.short}</small></span>
                      {stickers.includes(c.id) && <span className="done">⭐</span>}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
