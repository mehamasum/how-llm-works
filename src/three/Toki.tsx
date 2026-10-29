import { useFrame, type ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

export type Mood = 'happy' | 'think' | 'wow' | 'oops' | 'sleepy'

type Props = ThreeElements['group'] & { mood?: Mood; color?: string; talking?: boolean }

// Toki, the friendly token robot. Pure geometry, no model files to download.
export function Toki({ mood = 'happy', color = '#4cc9f0', talking = false, ...props }: Props) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const antenna = useRef<THREE.Mesh>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)

  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime
    if (root.current) root.current.position.y = Math.sin(t * 2) * 0.08
    if (head.current) {
      const wobble = mood === 'think' ? Math.sin(t * 1.5) * 0.15 : 0
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, pointer.x * 0.5, 0.08)
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -pointer.y * 0.25, 0.08)
      head.current.rotation.z = mood === 'oops' ? Math.sin(t * 8) * 0.06 : wobble
    }
    if (eyes.current) {
      const blink = Math.sin(t * 0.9) > 0.985 || mood === 'sleepy' ? 0.15 : mood === 'wow' ? 1.35 : 1
      eyes.current.scale.y = THREE.MathUtils.lerp(eyes.current.scale.y, blink, 0.4)
    }
    if (antenna.current) {
      antenna.current.position.x = Math.sin(t * 3) * 0.06
      const m = antenna.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = mood === 'think' ? 0.6 + Math.sin(t * 8) * 0.5 : 0.5
    }
    if (mouth.current) {
      const open = talking ? 0.6 + Math.abs(Math.sin(t * 14)) * 0.8 : mood === 'wow' ? 1.6 : 1
      mouth.current.scale.y = THREE.MathUtils.lerp(mouth.current.scale.y, open, 0.3)
    }
    const wave = mood === 'happy' || mood === 'wow' ? Math.sin(t * 5) * 0.5 : 0
    if (armR.current) armR.current.rotation.z = 0.5 + wave
    if (armL.current) armL.current.rotation.z = -0.5 + (mood === 'think' ? 0 : -wave * 0.3)
    if (armL.current && mood === 'think') armL.current.rotation.z = THREE.MathUtils.lerp(armL.current.rotation.z, -2.4, 0.1)
  })

  const smile = mood === 'oops' ? -1 : 1
  return (
    <group {...props}>
      <group ref={root}>
        {/* body */}
        <RoundedBox args={[1.3, 1.1, 1]} radius={0.35} smoothness={4} position={[0, -0.95, 0]}>
          <meshStandardMaterial color={color} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, -0.9, 0.51]}>
          <circleGeometry args={[0.22, 32]} />
          <meshStandardMaterial color="#ffc93c" emissive="#ffc93c" emissiveIntensity={0.4} />
        </mesh>
        {/* arms */}
        <group ref={armL} position={[-0.7, -0.75, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.13, 0.4, 6, 12]} />
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
        </group>
        <group ref={armR} position={[0.7, -0.75, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.13, 0.4, 6, 12]} />
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
        </group>
        {/* head */}
        <group ref={head} position={[0, 0.35, 0]}>
          <RoundedBox args={[1.8, 1.35, 1.3]} radius={0.45} smoothness={5}>
            <meshStandardMaterial color="#fff6e5" roughness={0.3} />
          </RoundedBox>
          <RoundedBox args={[1.45, 0.95, 0.1]} radius={0.3} smoothness={4} position={[0, 0, 0.62]}>
            <meshStandardMaterial color="#2b2140" roughness={0.2} />
          </RoundedBox>
          <group ref={eyes} position={[0, 0.1, 0.69]}>
            <mesh position={[-0.33, 0, 0]}>
              <capsuleGeometry args={[0.1, 0.14, 6, 12]} />
              <meshStandardMaterial color="#7bdff2" emissive="#7bdff2" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[0.33, 0, 0]}>
              <capsuleGeometry args={[0.1, 0.14, 6, 12]} />
              <meshStandardMaterial color="#7bdff2" emissive="#7bdff2" emissiveIntensity={1.2} />
            </mesh>
          </group>
          <mesh ref={mouth} position={[0, -0.22, 0.69]} rotation={[0, 0, smile > 0 ? Math.PI : 0]}>
            <torusGeometry args={[0.16, 0.04, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#ff6fae" emissive="#ff6fae" emissiveIntensity={1} />
          </mesh>
          {/* cheeks */}
          <mesh position={[-0.62, -0.15, 0.64]}>
            <circleGeometry args={[0.09, 20]} />
            <meshBasicMaterial color="#ff6fae" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.62, -0.15, 0.64]}>
            <circleGeometry args={[0.09, 20]} />
            <meshBasicMaterial color="#ff6fae" transparent opacity={0.7} />
          </mesh>
          {/* ears */}
          <mesh position={[-0.95, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.2, 20]} />
            <meshStandardMaterial color="#ff8c42" />
          </mesh>
          <mesh position={[0.95, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.2, 20]} />
            <meshStandardMaterial color="#ff8c42" />
          </mesh>
          {/* antenna */}
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
            <meshStandardMaterial color="#2b2140" />
          </mesh>
          <mesh ref={antenna} position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.15, 20, 20]} />
            <meshStandardMaterial color="#ff6fae" emissive="#ff6fae" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
