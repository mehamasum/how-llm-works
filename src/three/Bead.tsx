import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

type Props = {
  position: [number, number, number]
  color: string
  size?: number
  selected?: boolean
  special?: boolean
  delay?: number
  phase?: number
  onClick?: () => void
}

// A glossy candy bead that pops in, bobs gently and squishes when tapped.
export function Bead({ position, color, size = 0.5, selected, special, delay = 0, phase = 0, onClick }: Props) {
  const ref = useRef<THREE.Group>(null)
  const born = useRef<number | null>(null)
  const [hover, setHover] = useState(false)

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    born.current ??= t
    const age = Math.max(0, t - born.current - delay)
    // springy pop-in
    const pop = age <= 0 ? 0 : 1 + Math.exp(-age * 6) * Math.sin(age * 18) * -0.6 * (age < 1.2 ? 1 : 0)
    const target = (selected ? 1.35 : hover ? 1.15 : 1) * Math.min(1, age * 4) * pop
    const s = THREE.MathUtils.lerp(g.scale.x, target, 0.25)
    g.scale.setScalar(Math.max(0.0001, s))
    g.position.set(position[0], position[1] + Math.sin(t * 2 + phase) * 0.08 + (selected ? 0.25 : 0), position[2])
    g.rotation.y = Math.sin(t + phase) * 0.4 + (special ? t : 0)
  })

  return (
    <group
      ref={ref}
      scale={0.0001}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerOver={() => { setHover(true); document.body.style.cursor = onClick ? 'pointer' : '' }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}
    >
      {special ? (
        <mesh>
          <octahedronGeometry args={[size * 0.85, 0]} />
          <meshStandardMaterial color={color} roughness={0.15} metalness={0.3} emissive={color} emissiveIntensity={0.35} flatShading />
        </mesh>
      ) : (
        <RoundedBox args={[size * 1.4, size * 1.4, size * 1.4]} radius={size * 0.5} smoothness={4}>
          <meshStandardMaterial color={color} roughness={0.25} emissive={color} emissiveIntensity={selected ? 0.35 : 0.08} />
        </RoundedBox>
      )}
      {/* glossy highlight */}
      <mesh position={[-size * 0.25, size * 0.3, size * 0.6]}>
        <sphereGeometry args={[size * 0.14, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
