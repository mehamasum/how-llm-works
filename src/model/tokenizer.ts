import { useEffect, useState } from 'react'

export type Tok = { id: number; text: string; special?: boolean }

type Lib = typeof import('gpt-tokenizer/encoding/o200k_base')

export type Tokenizer = {
  tokenize: (s: string) => Tok[]
  chat: (messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) => Tok[]
  vocabSize: number
}

let cached: Promise<Tokenizer> | null = null

// The real GPT-4o tokenizer (o200k_base). It's a ~2 MB download, so it loads on demand.
export function loadTokenizer() {
  cached ??= import('gpt-tokenizer/encoding/o200k_base').then((lib: Lib) => {
    const toTok = (id: number): Tok => {
      const text = lib.decode([id])
      return { id, text, special: /^<\|.*\|>$/.test(text) }
    }
    return {
      tokenize: (s) => lib.encode(s).map(toTok),
      chat: (messages) => [...lib.encodeChat(messages, 'gpt-4o')].map(toTok),
      vocabSize: lib.vocabularySize,
    }
  })
  return cached
}

export function useTokenizer() {
  const [tk, setTk] = useState<Tokenizer | null>(null)
  useEffect(() => {
    let alive = true
    loadTokenizer().then((t) => alive && setTk(t))
    return () => { alive = false }
  }, [])
  return tk
}
