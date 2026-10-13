// Modelo 3D do robô AeroShield + cone do sensor, eletroímã e laser
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { CONFIG } from '../config'

const RAIO_RODA = 0.35
const POS_RODAS = [[0.75, 0.85], [-0.75, 0.85], [0.75, -0.85], [-0.75, -0.85]]

export function Robo({ sim }) {
  const grupo = useRef()
  const rodas = useRef([])
  const lidar = useRef()
  const cone = useRef()
  const ima = useRef()
  const lente = useRef()

  useFrame((_, delta) => {
    const r = sim.robo
    grupo.current.position.set(r.x, 0, r.z)
    grupo.current.rotation.y = r.rot

    // rodas giram proporcionalmente à velocidade
    for (const roda of rodas.current) if (roda) roda.rotation.y -=(r.velocidade / RAIO_RODA) * delta

    // LiDAR gira sempre que não está na base
    lidar.current.rotation.y += delta * (sim.fase === 'DOCKED' ? 0.5 : 8)

    // cone de visão só durante a varredura
    cone.current.visible = sim.fase === 'ZIGZAG' || sim.subfase === 'voltando'

    // eletroímã pulsando durante a coleta
    const coletando = sim.fase === 'INTERVENCAO' && sim.subfase === 'acao' && sim.alvo?.categoria === 'FOD'
    ima.current.visible = coletando
    if (coletando) {
      const s = 1 + (sim.timer * 3) % 1 * 1.5
      ima.current.scale.set(s, s, s)
      ima.current.material.opacity = 1 - ((sim.timer * 3) % 1)
    }

    // lente pisca quando um alvo está travado
    lente.current.emissiveIntensity = sim.fase === 'INTERVENCAO'
      ? 1.5 + Math.sin(sim.tempo * 20) * 1.2
      : 1.2
  })

  return (
    <group ref={grupo}>
      {/* chassi */}
      <RoundedBox args={[2.2, 0.7, 1.5]} radius={0.15} position={[0, 0.65, 0]} castShadow>
        <meshStandardMaterial color="#1976d2" metalness={0.3} roughness={0.4} />
      </RoundedBox>
      {/* tampa superior */}
      <RoundedBox args={[1.5, 0.2, 1.1]} radius={0.08} position={[-0.15, 1.08, 0]} castShadow>
        <meshStandardMaterial color="#0d47a1" />
      </RoundedBox>
      {/* faixa de sinalização */}
      <mesh position={[0, 0.65, 0.76]}>
        <boxGeometry args={[2, 0.12, 0.02]} />
        <meshStandardMaterial color="#ffca28" emissive="#ff8f00" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.65, -0.76]}>
        <boxGeometry args={[2, 0.12, 0.02]} />
        <meshStandardMaterial color="#ffca28" emissive="#ff8f00" emissiveIntensity={0.4} />
      </mesh>

      {/* rodas */}
      {POS_RODAS.map(([x, z], i) => (
        <group key={i} position={[x, RAIO_RODA, z]}>
          <mesh ref={el => (rodas.current[i] = el)} rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[RAIO_RODA, RAIO_RODA, 0.3, 16]} />
            <meshStandardMaterial color="#212121" roughness={0.9} />
            {/* calota para ver a rotação */}
            <mesh position={[0, z > 0 ? 0.16 : -0.16, 0.12]}>
              <boxGeometry args={[0.08, 0.02, 0.25]} />
              <meshStandardMaterial color="#90a4ae" />
            </mesh>
          </mesh>
        </group>
      ))}

      {/* LiDAR giratório */}
      <group ref={lidar} position={[0.35, 1.3, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.25, 0.3, 20]} />
          <meshStandardMaterial color="#37474f" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.08, 0.1, 0.18]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* lente / câmera frontal */}
      <mesh position={[1.12, 0.75, 0]}>
        <boxGeometry args={[0.06, 0.22, 0.6]} />
        <meshStandardMaterial ref={lente} color="#004d40" emissive="#1de9b6" emissiveIntensity={1.2} />
      </mesh>

      {/* antena */}
      <mesh position={[-0.8, 1.5, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8]} />
        <meshStandardMaterial color="#cfd8dc" />
      </mesh>
      <mesh position={[-0.8, 1.92, 0.4]}>
        <sphereGeometry args={[0.06]} />
        <meshStandardMaterial color="#ff1744" emissive="#ff1744" emissiveIntensity={2} />
      </mesh>

      {/* cone de visão do sensor (setor no chão, à frente do robô) */}
      <mesh ref={cone} rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
        <circleGeometry args={[CONFIG.raioDeteccao, 40, -Math.PI / 4, Math.PI / 2]} />
        <meshBasicMaterial color="#69f0ae" transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* anel do eletroímã */}
      <mesh ref={ima} rotation-x={-Math.PI / 2} position={[0, 0.08, 0]} visible={false}>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshBasicMaterial color="#ff5252" transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Feixe laser verde estroboscópico entre o robô e a ave
export function Laser({ sim }) {
  const feixe = useRef()
  const luz = useRef()
  const eixoY = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const inicio = useMemo(() => new THREE.Vector3(), [])
  const fim = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const ativo = sim.fase === 'INTERVENCAO' && sim.subfase === 'acao' && sim.alvo?.categoria === 'Fauna'
    const pisca = Math.floor(sim.tempo * 12) % 2 === 0
    feixe.current.visible = ativo && pisca
    luz.current.intensity = ativo && pisca ? 15 : 0
    if (!ativo) return

    const r = sim.robo
    inicio.set(r.x + Math.cos(r.rot) * 1.1, 0.75, r.z - Math.sin(r.rot) * 1.1)
    fim.set(sim.alvo.x, 0.5, sim.alvo.z)
    dir.subVectors(fim, inicio)
    const comprimento = dir.length()
    feixe.current.position.copy(inicio).addScaledVector(dir, 0.5)
    feixe.current.scale.set(1, comprimento, 1)
    feixe.current.quaternion.setFromUnitVectors(eixoY, dir.normalize())
    luz.current.position.copy(fim)
  })

  return (
    <>
      <mesh ref={feixe} visible={false}>
        <cylinderGeometry args={[0.08, 0.08, 1, 8]} />
        <meshBasicMaterial color="#76ff03" toneMapped={false} />
      </mesh>
      <pointLight ref={luz} color="#76ff03" distance={6} intensity={0} />
    </>
  )
}
