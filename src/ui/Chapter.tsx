import type { ReactNode } from 'react'

type Props = {
  num: number | string
  title: string
  sub: string
  story: ReactNode
  play: ReactNode
}

// Story on one side, playground on the other. Stacks on phones; side by side on wide screens.
export function Chapter({ num, title, sub, story, play }: Props) {
  return (
    <article className="enter">
      <header className="chapter-head">
        <div className="chapter-num">{num}</div>
        <div>
          <h1>{title}</h1>
          <div className="sub">{sub}</div>
        </div>
      </header>
      <div className="chapter-grid">
        <div className="story-col">{story}</div>
        <div className="play-col">{play}</div>
      </div>
    </article>
  )
}
