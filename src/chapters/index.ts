import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type ChapterInfo = {
  id: string
  emoji: string
  title: string
  short: string
  accent: string
  part: 'Start' | 'Build the brain' | 'Make it an assistant' | 'Practice makes better' | 'Finish'
  Component: LazyExoticComponent<ComponentType>
}

export const CHAPTERS: ChapterInfo[] = [
  { id: 'hello', emoji: '👋', title: 'Press Enter!', short: 'What happens when you chat?', accent: '#9b5de5', part: 'Start', Component: lazy(() => import('./Hello')) },
  { id: 'internet', emoji: '🌍', title: 'Read the Internet', short: 'Collecting tons of text', accent: '#4cc9f0', part: 'Build the brain', Component: lazy(() => import('./Internet')) },
  { id: 'tokens', emoji: '🍬', title: 'Words → Token Beads', short: 'Chopping text into pieces', accent: '#ff6fae', part: 'Build the brain', Component: lazy(() => import('./Tokens')) },
  { id: 'training', emoji: '🎯', title: 'The Guessing Game', short: 'Training = guessing the next piece', accent: '#3ddc97', part: 'Build the brain', Component: lazy(() => import('./Training')) },
  { id: 'wheel', emoji: '🎡', title: 'Spin the Word Wheel', short: 'How answers come out', accent: '#ff8c42', part: 'Build the brain', Component: lazy(() => import('./Wheel')) },
  { id: 'dreamer', emoji: '💭', title: 'The Document Dreamer', short: 'A base model only continues text', accent: '#7b6cf6', part: 'Build the brain', Component: lazy(() => import('./Dreamer')) },
  { id: 'chat', emoji: '💬', title: 'Teaching It to Chat', short: 'Practice conversations', accent: '#4cc9f0', part: 'Make it an assistant', Component: lazy(() => import('./Chat')) },
  { id: 'makeup', emoji: '🦄', title: 'Making Things Up', short: 'Hallucinations & tools', accent: '#ff6fae', part: 'Make it an assistant', Component: lazy(() => import('./MakeUp')) },
  { id: 'think', emoji: '🧠', title: 'Tokens to Think', short: 'Why step by step helps', accent: '#ffb000', part: 'Make it an assistant', Component: lazy(() => import('./Think')) },
  { id: 'cheese', emoji: '🧀', title: 'The Swiss-Cheese Brain', short: 'Weird little holes', accent: '#ff8c42', part: 'Make it an assistant', Component: lazy(() => import('./Cheese')) },
  { id: 'practice', emoji: '🏋️', title: 'Practice Makes Better', short: 'Reinforcement learning', accent: '#3ddc97', part: 'Practice makes better', Component: lazy(() => import('./Practice')) },
  { id: 'feedback', emoji: '👍', title: 'Thumbs Up, Thumbs Down', short: 'Learning from people', accent: '#9b5de5', part: 'Practice makes better', Component: lazy(() => import('./Feedback')) },
  { id: 'finale', emoji: '🏆', title: 'The Whole Journey', short: 'So what are you talking to?', accent: '#ffb000', part: 'Finish', Component: lazy(() => import('./Finale')) },
]

export const indexOf = (id: string) => Math.max(0, CHAPTERS.findIndex((c) => c.id === id))
