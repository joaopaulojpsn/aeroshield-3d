// Três modos de câmera: orbital livre, seguir o robô e visão superior
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const CENTRO = [26, 0, 4]

export function Camera({ sim, modo }) {
  const { camera } = useThree()
  const desejada = useMemo(() => new THREE.Vector3(), [])
  const foco = useMemo(() => new THREE.Vector3(), [])

  // posição inicial de cada modo
  useEffect(() => {
    if (modo === 'orbital') {
      camera.position.set(4, 30, 46)
      camera.lookAt(...CENTRO)
    } else if (modo === 'topo') {
      camera.position.set(26, 62, 0.01)
      camera.lookAt(26, 0, 0)
    }
  }, [modo, camera])

  useFrame((_, delta) => {
    if (modo !== 'seguir') return
    const r = sim.robo
    // câmera atrás e acima do robô, suavizada
    desejada.set(r.x - Math.cos(r.rot) * 9, 5.5, r.z + Math.sin(r.rot) * 9)
    camera.position.lerp(desejada, 1 - Math.exp(-delta * 3))
    foco.set(r.x + Math.cos(r.rot) * 4, 0.8, r.z - Math.sin(r.rot) * 4)
    camera.lookAt(foco)
  })

  if (modo === 'orbital') {
    return (
      <OrbitControls
        makeDefault
        target={CENTRO}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={6}
        maxDistance={110}
      />
    )
  }
  return null
}
