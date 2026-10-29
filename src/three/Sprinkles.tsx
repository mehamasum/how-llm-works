import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../ui/colors'

// Floating confetti-ish shapes in the background, drawn as one instanced mesh per shape.
export function Sprinkles({ count = 40, spread = 14, depth = -4 }: { count?: number; spread?: number; depth?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        p: new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread * 0.6, depth - Math.random() * 3),
        r: Math.random() * Math.PI,
        s: 0.08 + Math.random() * 0.14,
        speed: 0.2 + Math.random() * 0.6,
        color: new THREE.Color(PALETTE[i % PALETTE.length]),
        kind: i % 3,
      })),
    [count, spread, depth],
  )
  const refs = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)]
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const idx = [0, 0, 0]
    for (const it of items) {
      const mesh = refs[it.kind].current
      if (!mesh) continue
      dummy.position.set(it.p.x + Math.sin(t * it.speed + it.r) * 0.3, it.p.y + Math.sin(t * it.speed * 1.3 + it.r) * 0.4, it.p.z)
      dummy.rotation.set(t * it.speed + it.r, t * it.speed * 0.7, it.r)
      dummy.scale.setScalar(it.s)
      dummy.updateMatrix()
      const i = idx[it.kind]++
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, it.color)
    }
    refs.forEach((r) => {
      if (!r.current) return
      r.current.instanceMatrix.needsUpdate = true
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true
    })
  })

  const n = (k: number) => items.filter((i) => i.kind === k).length
  return (
    <group>
      <instancedMesh ref={refs[0]} args={[undefined, undefined, n(0)]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={refs[1]} args={[undefined, undefined, n(1)]}>
        <torusGeometry args={[1, 0.4, 8, 20]} />
        <meshStandardMaterial roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={refs[2]} args={[undefined, undefined, n(2)]}>
        <capsuleGeometry args={[0.5, 1.6, 4, 8]} />
        <meshStandardMaterial roughness={0.4} />
      </instancedMesh>
    </group>
  )
}
