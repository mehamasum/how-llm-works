import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Bead } from './Bead'
import { colorFor } from '../ui/colors'
import type { Tok } from '../model/tokenizer'

export type View = 'letters' | 'tokens'

export const show = (s: string) => s.replace(/ /g, '·').replace(/\n/g, '⏎')

// Friendly names for the chat-format special tokens.
const SPECIAL: Record<string, string> = { '<|im_start|>': '▶start', '<|im_sep|>': '➜', '<|im_end|>': '■end' }
export const specialLabel = (s: string) => SPECIAL[s] ?? s.replace(/<\|(.*)\|>/, '$1')

export function BeadRows({ toks, view, sel, onSel }: { toks: Tok[]; view: View; sel: number; onSel: (i: number) => void }) {
  const vw = useThree((s) => s.viewport.width)
  // In "letters" view every character is its own bead, coloured by the token it will join.
  const items = useMemo(
    () => (view === 'tokens'
      ? toks.map((t, i) => ({ label: t.special ? specialLabel(t.text) : t.text, tok: i }))
      : toks.flatMap((t, i) => [...t.text].map((c) => ({ label: c, tok: i })))),
    [toks, view],
  )
  const gap = view === 'tokens' ? 1.25 : 0.62
  const perRow = Math.max(3, Math.floor((vw - 0.8) / gap))
  const rows = Math.ceil(items.length / perRow)
  const size = view === 'tokens' ? 0.38 : 0.2
  const pts = items.map((_, i) => {
    const r = Math.floor(i / perRow)
    const c = i % perRow
    const rowLen = Math.min(perRow, items.length - r * perRow)
    const x = (c - (rowLen - 1) / 2) * gap
    return new THREE.Vector3(x, ((rows - 1) / 2 - r) * 1.15, Math.sin(i * 0.7) * 0.15)
  })
  const curve = pts.length > 1 ? new THREE.CatmullRomCurve3(pts) : null
  const fit = Math.min(1, 4.2 / Math.max(1, rows * 1.15))

  return (
    <group scale={fit}>
      {curve && (
        <mesh>
          <tubeGeometry args={[curve, Math.max(8, pts.length * 6), 0.03, 6, false]} />
          <meshStandardMaterial color="#2b2140" />
        </mesh>
      )}
      {items.map((it, i) => (
        <group key={`${view}-${i}-${it.label}`}>
          <Bead position={[pts[i].x, pts[i].y, pts[i].z]} color={toks[it.tok]?.special ? '#ffc93c' : colorFor(it.tok)} special={toks[it.tok]?.special} size={size} delay={i * 0.03} phase={i * 0.5}
            selected={it.tok === sel} onClick={() => onSel(it.tok)} />
          {(view === 'tokens' ? items.length <= 36 : items.length <= 70) && (
            <Html position={[pts[i].x, pts[i].y - size * 1.5, pts[i].z]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: view === 'tokens' ? 12 : 10, fontWeight: 700, whiteSpace: 'pre', color: '#2b2140', background: 'rgba(255,255,255,.85)', borderRadius: 6, padding: '0 4px' }}>
                {show(it.label)}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  )
}

