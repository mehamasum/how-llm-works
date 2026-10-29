import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { AdaptiveDpr } from '@react-three/drei'

type Props = {
  children: ReactNode
  hint?: string
  badge?: ReactNode
  camera?: { position?: [number, number, number]; fov?: number }
  height?: string
  className?: string
}

// A rounded "toy box" holding one Three.js scene. The canvas is only created while the box
// is near the screen, so phones never juggle more than one or two WebGL contexts.
export function Stage({ children, hint, badge, camera, height, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`stage ${className ?? ''}`} style={height ? { height } : undefined}>
      {visible ? (
        <Canvas
          dpr={[1, 2]}
          camera={{ position: camera?.position ?? [0, 0, 8], fov: camera?.fov ?? 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        >
          <AdaptiveDpr pixelated />
          <ambientLight intensity={0.9} />
          <hemisphereLight args={['#fff6e5', '#9b5de5', 0.8]} />
          <directionalLight position={[4, 6, 5]} intensity={1.6} />
          <directionalLight position={[-5, -2, 3]} intensity={0.5} color="#4cc9f0" />
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      ) : (
        <div className="stage-loading">✨ loading toys…</div>
      )}
      {hint && <div className="stage-hint">{hint}</div>}
      {badge && <div className="stage-badge">{badge}</div>}
    </div>
  )
}
