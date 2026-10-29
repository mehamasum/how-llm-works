import type { ReactNode } from 'react'
import { useApp } from '../store'

// Shows the kid-friendly or the curious version of a passage, depending on the global toggle.
export function Explain({ kid, curious }: { kid: ReactNode; curious: ReactNode }) {
  const mode = useApp((s) => s.mode)
  return <div className="mode-text" key={mode}>{mode === 'kid' ? kid : curious}</div>
}

export function ModeSwitch() {
  const { mode, setMode } = useApp()
  return (
    <div className="switch" role="group" aria-label="Explanation level">
      <button className={mode === 'kid' ? 'on' : ''} onClick={() => setMode('kid')} aria-pressed={mode === 'kid'}>🧒 Kid</button>
      <button className={mode === 'curious' ? 'on' : ''} onClick={() => setMode('curious')} aria-pressed={mode === 'curious'}>🔍 Curious</button>
    </div>
  )
}
