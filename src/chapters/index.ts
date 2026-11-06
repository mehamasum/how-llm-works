import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type Era = 'now' | 'past'

export type ChapterInfo = {
  id: string
  emoji: string
  title: string
  short: string
  accent: string
  era: Era
  part: 'Start' | 'Flashback: building Toki' | 'Back to now: answering you' | 'Looking ahead' | 'Finish'
  /** Why this chapter comes next: picks up the question the previous chapter left open. */
  bridge: string
  /** The one big idea this chapter adds. The finale strings these together into the whole story. */
  lesson: string
  Component: LazyExoticComponent<ComponentType>
}

// The tour starts in the present (you type to Toki), flashes back to how Toki was built,
// then returns to the present to follow Toki answering you.
export const CHAPTERS: ChapterInfo[] = [
  {
    id: 'hello', emoji: '👋', title: 'Press Enter!', short: 'What happens when you chat?', accent: '#9b5de5', era: 'now', part: 'Start',
    bridge: '', lesson: 'You typed a message to Toki. To understand its answer, we rewind to how Toki was built.',
    Component: lazy(() => import('./Hello')),
  },
  {
    id: 'internet', emoji: '🌍', title: 'Read the Internet', short: 'Collecting tons of text', accent: '#4cc9f0', era: 'past', part: 'Flashback: building Toki',
    bridge: 'Nobody can talk without first hearing lots of words. So where does Toki get all its reading?',
    lesson: 'Toki learns from a giant, cleaned-up pile of text collected from the internet.',
    Component: lazy(() => import('./Internet')),
  },
  {
    id: 'tokens', emoji: '🍬', title: 'Words → Token Beads', short: 'Chopping text into pieces', accent: '#ff6fae', era: 'past', part: 'Flashback: building Toki',
    bridge: "That pile is text, but Toki's brain only works with numbers. So first the text must be chopped up and numbered.",
    lesson: 'Text is chopped into token beads, and every bead is a number. Those numbers are all Toki ever sees.',
    Component: lazy(() => import('./Tokens')),
  },
  {
    id: 'training', emoji: '🎯', title: 'The Guessing Game', short: 'Training = guessing the next piece', accent: '#3ddc97', era: 'past', part: 'Flashback: building Toki',
    bridge: 'Now there are trillions of numbered beads. How does Toki learn anything from them?',
    lesson: 'Toki learns by guessing the next bead, billions of times, nudging its knobs a little after every guess.',
    Component: lazy(() => import('./Training')),
  },
  {
    id: 'inside', emoji: '🔬', title: "Inside Toki's Head", short: 'What the knobs actually do', accent: '#f15bb5', era: 'past', part: 'Flashback: building Toki',
    bridge: 'Toki has billions of knobs. But what actually happens inside when it guesses the next bead?',
    lesson: 'Inside, the beads flow through the same stack of maths layers every time. Every bead gets the same amount of work, and nothing is remembered between turns.',
    Component: lazy(() => import('./Inside')),
  },
  {
    id: 'dreamer', emoji: '💭', title: 'The Document Dreamer', short: 'A base model only continues text', accent: '#7b6cf6', era: 'past', part: 'Flashback: building Toki',
    bridge: 'So that is the machine. After months of guessing practice, what can it actually do?',
    lesson: "The result is a page dreamer: it continues any text like the internet would, but it doesn't help or answer yet.",
    Component: lazy(() => import('./Dreamer')),
  },
  {
    id: 'chat', emoji: '💬', title: 'Teaching It to Chat', short: 'Practice conversations', accent: '#4cc9f0', era: 'past', part: 'Flashback: building Toki',
    bridge: "A pretend chat page can trick the dreamer into helping, but it's wobbly. How do we teach it to chat for real?",
    lesson: 'Practising on example chats written by careful helpers turns the dreamer into an assistant that imitates them.',
    Component: lazy(() => import('./Chat')),
  },
  {
    id: 'think', emoji: '🧠', title: 'Tokens to Think', short: 'Why step by step helps', accent: '#ffb000', era: 'past', part: 'Flashback: building Toki',
    bridge: 'Those helpers write the practice answers Toki copies. So how should a good answer be written?',
    lesson: 'Each bead gets only a small cup of thinking, so good answers spread the thinking out, step by step.',
    Component: lazy(() => import('./Think')),
  },
  {
    id: 'practice', emoji: '🏋️', title: 'Practice Makes Better', short: 'Reinforcement learning', accent: '#3ddc97', era: 'past', part: 'Flashback: building Toki',
    bridge: "But even the helpers don't know which steps work best for Toki's brain. So let Toki find out for itself!",
    lesson: 'By trying problems with checkable answers again and again, Toki discovers its own ways of thinking that work.',
    Component: lazy(() => import('./Practice')),
  },
  {
    id: 'feedback', emoji: '👍', title: 'Thumbs Up, Thumbs Down', short: 'Learning from people', accent: '#9b5de5', era: 'past', part: 'Flashback: building Toki',
    bridge: "Math can be checked. But a joke or a poem can't. How does Toki practise those?",
    lesson: "For things with no single right answer, people's thumbs train a judge robot, and Toki practises with it, but only for a little while.",
    Component: lazy(() => import('./Feedback')),
  },
  {
    id: 'wheel', emoji: '🎡', title: 'Spin the Word Wheel', short: 'How Toki answers you', accent: '#ff8c42', era: 'now', part: 'Back to now: answering you',
    bridge: 'Toki is built, and its knobs are now frozen. Back to your message: how does Toki actually write an answer?',
    lesson: "Toki writes its answer one bead at a time by spinning a wheel of chances, and it forgets the chat when it's over.",
    Component: lazy(() => import('./Wheel')),
  },
  {
    id: 'makeup', emoji: '🦄', title: 'Making Things Up', short: 'Hallucinations & tools', accent: '#ff6fae', era: 'now', part: 'Back to now: answering you',
    bridge: "Spinning for words works great when Toki knows the answer. But what if it doesn't?",
    lesson: "Toki's memory is fuzzy and stops on a date, so it may confidently make things up. Saying “I don't know”, searching, and pasting the facts into the chat all help.",
    Component: lazy(() => import('./MakeUp')),
  },
  {
    id: 'cheese', emoji: '🧀', title: 'The Swiss-Cheese Brain', short: 'Weird little holes', accent: '#ff8c42', era: 'now', part: 'Back to now: answering you',
    bridge: 'Toki sees beads, not letters, and thinks in small cups. That leads to some surprising holes.',
    lesson: 'Toki can trip on easy things like counting letters, so double-check what matters.',
    Component: lazy(() => import('./Cheese')),
  },
  {
    id: 'next', emoji: '🚀', title: "What's Next & Your Turn", short: 'Where AI is going, and using it well', accent: '#00bbf9', era: 'now', part: 'Looking ahead',
    bridge: "Toki has holes, but it keeps getting better. So what's coming next, and how do you use it well today?",
    lesson: 'Pictures, sounds and actions are becoming beads too. Use these models as powerful tools: give them context, let them use tools, and check what matters.',
    Component: lazy(() => import('./Next')),
  },
  {
    id: 'finale', emoji: '🏆', title: 'The Whole Journey', short: 'So what are you talking to?', accent: '#ffb000', era: 'now', part: 'Finish',
    bridge: '', lesson: '', Component: lazy(() => import('./Finale')),
  },
]

export const indexOf = (id: string) => Math.max(0, CHAPTERS.findIndex((c) => c.id === id))
