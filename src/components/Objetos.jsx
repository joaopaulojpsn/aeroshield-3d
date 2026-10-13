// Objetos na pista: FOD (parafuso, pneu) e fauna (quero-quero)
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Edges } from '@react-three/drei'

// objetos um pouco maiores que o real para ficarem visíveis na visão geral
const ESCALA_OBJETOS = 1.7

export function Objetos({ sim }) {
  return sim.objetos.map(o => <Objeto key={o.id} obj={o} />)
}

function Objeto({ obj }) {
  const grupo = useRef()
  const modelo = useRef()
  const caixa = useRef()
  const [marcado, setMarcado] = useState(false)
  const marcadoRef = useRef(false)

  useFrame(({ clock }) => {
    const g = grupo.current
    const e = obj.estado

    // rótulo da IA: só enquanto o alvo está travado (atualiza o React só quando muda)
    const m = e === 'detectado' || e === 'coletando'
    if (m !== marcadoRef.current) {
      marcadoRef.current = m
      setMarcado(m)
    }

    const visivel = e !== 'coletado' && e !== 'dispersado'
    g.visible = visivel
    if (!visivel) return

    let y = 0, escala = 1, x = obj.x, z = obj.z
    if (e === 'coletando') {
      // sobe em direção ao eletroímã e encolhe
      y = obj.anim * 0.6
      escala = 1 - obj.anim * 0.9
    } else if (e === 'fugindo') {
      // ave voa para longe da pista
      const t = obj.anim
      y = t * t * 1.5 + t * 2
      x += t * 5
      z += Math.sign(obj.z || 1) * t * 6
    }
    g.position.set(x, y, z)
    modelo.current.scale.setScalar(escala * ESCALA_OBJETOS)

    if (obj.tipo === 'fauna') animarAve(modelo.current, e, clock.elapsedTime, obj.anim)

    // bounding box pulsando enquanto o alvo está travado
    caixa.current.visible = m
    if (m) caixa.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 8) * 0.04)
  })

  const tamanho = (obj.tipo === 'fauna' ? [1.4, 1.3, 1.2] : [1.4, 0.8, 1.4]).map(v => v * ESCALA_OBJETOS)

  return (
    <group ref={grupo} position={[obj.x, 0, obj.z]}>
      <group ref={modelo}>
        {obj.tipo === 'parafuso' && <Parafuso />}
        {obj.tipo === 'pneu' && <PedacoPneu />}
        {obj.tipo === 'fauna' && <QueroQuero />}
      </group>

      {/* bounding box da IA */}
      <mesh ref={caixa} position={[0, tamanho[1] / 2, 0]} visible={false}>
        <boxGeometry args={tamanho} />
        <meshBasicMaterial transparent opacity={0.08} color="#ff1744" depthWrite={false} />
        <Edges color="#ff1744" />
      </mesh>

      {marcado && (
        <Html position={[0, tamanho[1] + 0.5, 0]} center distanceFactor={40} zIndexRange={[10, 0]}>
          <div className="rotulo-ia">
            {obj.nome} <span>{obj.conf}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

function Parafuso() {
  return (
    <group rotation-y={0.6} position={[0, 0.12, 0]}>
      {/* rosca */}
      <mesh rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.9, 12]} />
        <meshStandardMaterial color="#b0bec5" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* cabeça sextavada */}
      <mesh rotation-z={Math.PI / 2} position={[-0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.14, 6]} />
        <meshStandardMaterial color="#cfd8dc" metalness={0.9} roughness={0.25} />
      </mesh>
      {/* porca */}
      <mesh rotation-z={Math.PI / 2} position={[0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.12, 6]} />
        <meshStandardMaterial color="#90a4ae" metalness={0.9} roughness={0.35} />
      </mesh>
    </group>
  )
}

function PedacoPneu() {
  return (
    <group position={[0, 0.15, 0]} rotation-y={-0.4}>
      <mesh rotation-x={-Math.PI / 2} castShadow>
        <torusGeometry args={[0.55, 0.16, 8, 20, Math.PI * 0.85]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>
      {/* lascas soltas */}
      <mesh position={[0.5, -0.05, 0.4]} rotation={[0.2, 0.8, 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.08, 0.18]} />
        <meshStandardMaterial color="#212121" roughness={1} />
      </mesh>
    </group>
  )
}

function QueroQuero() {
  return (
    <group position={[0, 0.25, 0]}>
      {/* pernas */}
      {[-0.08, 0.08].map(z => (
        <mesh key={z} position={[0, 0.12, z]}>
          <cylinderGeometry args={[0.02, 0.02, 0.35]} />
          <meshStandardMaterial color="#e57373" />
        </mesh>
      ))}
      <group name="corpo" position={[0, 0.45, 0]}>
        {/* corpo cinza-acastanhado */}
        <mesh scale={[0.5, 0.3, 0.28]} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#8d8a78" roughness={0.8} />
        </mesh>
        {/* peito preto e barriga branca */}
        <mesh position={[0.22, -0.02, 0]} scale={[0.22, 0.2, 0.22]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color="#212121" />
        </mesh>
        <mesh position={[0.05, -0.14, 0]} scale={[0.32, 0.15, 0.22]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color="#fafafa" />
        </mesh>
        {/* cabeça */}
        <group name="cabeca" position={[0.42, 0.22, 0]}>
          <mesh>
            <sphereGeometry args={[0.15, 14, 12]} />
            <meshStandardMaterial color="#9e9a86" />
          </mesh>
          <mesh position={[0.02, 0.1, 0]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
          {/* topete característico */}
          <mesh position={[-0.12, 0.17, 0]} rotation-z={1.1}>
            <coneGeometry args={[0.025, 0.25, 6]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
          {/* bico */}
          <mesh position={[0.2, -0.02, 0]} rotation-z={-Math.PI / 2}>
            <coneGeometry args={[0.04, 0.16, 8]} />
            <meshStandardMaterial color="#e57373" />
          </mesh>
          {/* olhos vermelhos */}
          {[-0.1, 0.1].map(z => (
            <mesh key={z} position={[0.09, 0.03, z]}>
              <sphereGeometry args={[0.03]} />
              <meshStandardMaterial color="#d32f2f" />
            </mesh>
          ))}
        </group>
        {/* asas */}
        {[-1, 1].map(lado => (
          <group key={lado} name={`asa${lado}`} position={[0, 0.08, lado * 0.24]}>
            <mesh position={[-0.1, 0, lado * 0.25]}>
              <boxGeometry args={[0.55, 0.04, 0.5]} />
              <meshStandardMaterial color="#5d5a4c" />
            </mesh>
          </group>
        ))}
        {/* cauda */}
        <mesh position={[-0.55, 0.02, 0]} rotation-z={0.2}>
          <boxGeometry args={[0.3, 0.05, 0.22]} />
          <meshStandardMaterial color="#212121" />
        </mesh>
      </group>
    </group>
  )
}

function animarAve(modelo, estado, t, animFuga) {
  const corpo = modelo.getObjectByName('corpo')
  const cabeca = modelo.getObjectByName('cabeca')
  const asaA = modelo.getObjectByName('asa-1')
  const asaB = modelo.getObjectByName('asa1')
  if (!corpo) return

  if (estado === 'fugindo') {
    const bate = Math.sin(t * 25) * 0.9
    asaA.rotation.x = bate
    asaB.rotation.x = -bate
    corpo.rotation.z = 0.3
    modelo.rotation.y = -0.7 // vira para a direção da fuga
    modelo.children[0].children.forEach(c => { if (c.name !== 'corpo') c.visible = animFuga < 0.2 })
  } else if (estado === 'detectado') {
    // ave em alerta: cabeça agitada, asas semiabertas
    cabeca.rotation.y = Math.sin(t * 9) * 0.6
    asaA.rotation.x = 0.25 + Math.sin(t * 14) * 0.15
    asaB.rotation.x = -asaA.rotation.x
  } else {
    // comportamento normal: bicando o chão de vez em quando
    const bicada = Math.max(0, Math.sin(t * 1.3)) ** 6
    cabeca.rotation.z = -bicada * 0.9
    cabeca.rotation.y = Math.sin(t * 0.7) * 0.4
    asaA.rotation.x = 0
    asaB.rotation.x = 0
  }
}

