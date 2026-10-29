import { Component, type ReactNode } from 'react'

// Catches crashes (including a chapter file that went missing after a redeploy) and offers a reload.
export class Oops extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="card enter" style={{ maxWidth: 520, margin: '10vh auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>🙈</div>
        <h2>Oops, Toki tripped!</h2>
        <p className="muted">Something didn't load properly. A quick refresh usually fixes it.</p>
        <button className="btn pink" onClick={() => window.location.reload()}>↻ Try again</button>
      </div>
    )
  }
}
