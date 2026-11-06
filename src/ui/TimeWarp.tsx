import { useEffect } from 'react'
import { blip } from '../sound'

// Full-screen "time travel" moment shown when the tour jumps between the present and the flashback.
export function TimeWarp({ to, onDone }: { to: 'past' | 'now'; onDone: () => void }) {
  useEffect(() => {
    blip(to === 'past' ? 'boop' : 'ding')
    const id = setTimeout(onDone, 2200)
    return () => clearTimeout(id)
  }, [to, onDone])

  const past = to === 'past'
  return (
    <div className={`timewarp ${to}`} onClick={onDone} role="status" aria-live="polite">
      <div className="warp-rings" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => <span key={i} style={{ animationDelay: `${i * 0.18}s` }} />)}
      </div>
      <div className="warp-clock" aria-hidden>{past ? '🕰️' : '⏰'}</div>
      <div className="warp-text">
        <div className="warp-title">{past ? '⏪ Rewinding time…' : '⏩ Zooming back to now…'}</div>
        <div>{past ? 'Back to long ago, when Toki was being built!' : 'Toki is all grown up and ready to answer you!'}</div>
      </div>
      <div className="warp-skip">tap to skip</div>
    </div>
  )
}
