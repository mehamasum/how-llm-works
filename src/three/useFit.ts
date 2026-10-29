import { useThree } from '@react-three/fiber'

// Scale factor that shrinks a scene designed for `designWidth` × `designHeight` world units
// so it fits short or narrow stages (phones, landscape tablets).
export function useFit(designWidth: number, designHeight = Infinity) {
  const { width, height } = useThree((s) => s.viewport)
  return Math.min(1, width / designWidth, height / designHeight)
}
