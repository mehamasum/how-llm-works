import type { Tok } from '../model/tokenizer'
import { show, specialLabel } from '../three/BeadRows'
import { colorFor } from './colors'

// Floating card inside the 3D stage describing the tapped bead, so a selection is always visible.
export function BeadInspector({ toks, sel, onClose }: { toks: Tok[]; sel: number; onClose: () => void }) {
  const t = toks[sel]
  if (!t) return null
  return (
    <div className="inspector" key={sel} role="status" aria-live="polite">
      <span className="chip sel" style={{ background: t.special ? '#ffc93c' : colorFor(sel), fontSize: '1.1rem', cursor: 'default' }}>
        {t.special ? specialLabel(t.text) : show(t.text)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div><b>Bead {sel + 1} of {toks.length}</b>{t.special && <span className="tag" style={{ marginLeft: 6, background: 'var(--sun)', color: '#2b2140' }}>⭐ special</span>}</div>
        <div className="muted">Toki sees: <b className="mono" style={{ color: 'var(--ink)' }}>{t.id.toLocaleString()}</b></div>
      </div>
      <button className="btn ghost icon-btn small" onClick={onClose} aria-label="Close bead details">✕</button>
    </div>
  )
}
