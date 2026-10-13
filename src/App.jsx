// AeroShield Robotics V4 — Simulador 3D
import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { criarSimulacao, atualizar, alternarSinalTorre, reposicionarObjetos, resetar, capturar } from './simulacao'
import { Pista, Dock, Torre } from './components/Cenario'
import { Robo, Laser } from './components/Robo'
import { Objetos } from './components/Objetos'
import { Camera } from './components/Camera'
import { HUD } from './components/HUD'

// Roda a lógica do robô a cada frame (antes de desenhar)
function Simulador({ sim, velocidadeRef }) {
  useFrame((_, delta) => atualizar(sim, delta, velocidadeRef.current))
  return null
}

export default function App() {
  // a simulação vive fora do React (objeto mutável) para não re-renderizar a cada frame
  const [sim] = useState(criarSimulacao)

  const [estado, setEstado] = useState(() => capturar(sim))
  const [camera, setCamera] = useState('orbital')
  const [velocidade, setVelocidade] = useState(1)
  const velocidadeRef = useRef(1)

  useEffect(() => { velocidadeRef.current = velocidade }, [velocidade])

  // o HUD é atualizado 10 vezes por segundo
  useEffect(() => {
    const id = setInterval(() => setEstado(capturar(sim)), 100)
    return () => clearInterval(id)
  }, [sim])

  // atalhos de teclado: Espaço = torre, 1/2/3 = câmeras
  useEffect(() => {
    const tecla = e => {
      if (e.code === 'Space') { e.preventDefault(); alternarSinalTorre(sim) }
      if (e.key === '1') setCamera('orbital')
      if (e.key === '2') setCamera('seguir')
      if (e.key === '3') setCamera('topo')
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [sim])

  const acao = fn => () => { fn(sim); setEstado(capturar(sim)) }

  return (
    <>
      <Canvas shadows camera={{ position: [4, 30, 46], fov: 45, near: 0.1, far: 3000 }}>
        <Simulador sim={sim} velocidadeRef={velocidadeRef} />

        {/* Iluminação diurna */}
        <color attach="background" args={['#9cc9ec']} />
        <hemisphereLight args={['#dbeafe', '#4a6b2f', 0.6]} />
        <directionalLight
          position={[60, 50, -30]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-camera-far={200}
        />
        <fog attach="fog" args={['#9cc9ec', 100, 260]} />

        <Pista />
        <Dock />
        <Torre sim={sim} />
        {/* a key recria os objetos quando a lista muda (reposicionar/resetar) */}
        <group key={estado.versaoObjetos}>
          <Objetos sim={sim} />
        </group>
        <Robo sim={sim} />
        <Laser sim={sim} />
        <ContactShadows position={[28, 0.02, 0]} scale={[80, 30]} opacity={0.35} blur={2} far={4} />

        <Camera sim={sim} modo={camera} />
      </Canvas>

      <HUD
        estado={estado}
        camera={camera}
        setCamera={setCamera}
        velocidade={velocidade}
        setVelocidade={setVelocidade}
        onTorre={acao(alternarSinalTorre)}
        onReposicionar={acao(reposicionarObjetos)}
        onResetar={acao(resetar)}
      />
    </>
  )
}
