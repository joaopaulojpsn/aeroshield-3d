// Pista, grama, Base Dock e torre de controle com semáforo
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Rotulo } from './Rotulo'
import { CONFIG } from '../config'

const { xInicio, xFim, largura } = CONFIG.pista
const comprimento = xFim - xInicio
const centroX = (xInicio + xFim) / 2

export function Pista() {
  const faixas = []
  for (let x = xInicio + 3; x < xFim - 2; x += 6) faixas.push(x)

  return (
    <group>
      {/* Grama */}
      <mesh rotation-x={-Math.PI / 2} position={[centroX, -0.02, 0]} receiveShadow>
        <planeGeometry args={[comprimento + 80, largura + 70]} />
        <meshStandardMaterial color="#5b8a3a" roughness={1} />
      </mesh>

      {/* Asfalto */}
      <mesh rotation-x={-Math.PI / 2} position={[centroX, 0, 0]} receiveShadow>
        <planeGeometry args={[comprimento, largura]} />
        <meshStandardMaterial color="#3c3f44" roughness={0.95} />
      </mesh>

      {/* Faixas laterais amarelas */}
      {[-1, 1].map(lado => (
        <mesh key={lado} rotation-x={-Math.PI / 2} position={[centroX, 0.01, lado * (largura / 2 - 0.6)]}>
          <planeGeometry args={[comprimento - 0.4, 0.3]} />
          <meshStandardMaterial color="#ffcc00" />
        </mesh>
      ))}

      {/* Eixo central tracejado */}
      {faixas.map(x => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.01, 0]}>
          <planeGeometry args={[3, 0.25]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Marcas de cabeceira no fim da pista */}
      {[-8, -5.5, -3, 3, 5.5, 8].map(z => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[xFim - 2.5, 0.01, z]}>
          <planeGeometry args={[3.5, 1.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Luzes de borda da pista */}
      {Array.from({ length: Math.floor(comprimento / 6) + 1 }, (_, i) => xInicio + i * 6).map(x =>
        [-1, 1].map(lado => (
          <mesh key={`${x}${lado}`} position={[x, 0.15, lado * (largura / 2 + 0.4)]}>
            <cylinderGeometry args={[0.12, 0.12, 0.3, 8]} />
            <meshStandardMaterial color="#fff59d" emissive="#ffeb3b" emissiveIntensity={0.6} />
          </mesh>
        ))
      )}
    </group>
  )
}

export function Dock() {
  const borda = useRef()
  useFrame(({ clock }) => {
    borda.current.emissiveIntensity = 0.8 + Math.sin(clock.elapsedTime * 2) * 0.4
  })
  const { dock, entradaPista } = CONFIG
  const w = 3.4, p = 4                       // largura (X) e profundidade (Z) da baia
  const bordaPista = -largura / 2            // borda da pista do lado da torre
  const fimTaxi = dock.z + p / 2             // onde a taxiway encontra a baia
  const compTaxi = bordaPista - fimTaxi

  return (
    <group>
      {/* Taxiway: asfalto ligando a pista até a baia */}
      <mesh rotation-x={-Math.PI / 2} position={[entradaPista.x, 0.005, fimTaxi + compTaxi / 2]} receiveShadow>
        <planeGeometry args={[3.6, compTaxi]} />
        <meshStandardMaterial color="#3c3f44" roughness={0.95} />
      </mesh>
      {/* linha central amarela da taxiway */}
      <mesh rotation-x={-Math.PI / 2} position={[entradaPista.x, 0.012, fimTaxi + compTaxi / 2 + 0.6]}>
        <planeGeometry args={[0.15, compTaxi + 1.2]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      {/* luzes azuis de borda da taxiway */}
      {[0.25, 0.5, 0.75].map(f =>
        [-1, 1].map(lado => (
          <mesh key={`${f}${lado}`} position={[entradaPista.x + lado * 2.1, 0.15, fimTaxi + compTaxi * f]}>
            <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />
            <meshStandardMaterial color="#90caf9" emissive="#2196f3" emissiveIntensity={1.2} />
          </mesh>
        ))
      )}

      {/* Baia de estacionamento e recarga */}
      <group position={[dock.x, 0, dock.z]}>
        <mesh position={[0, 0.04, 0]} receiveShadow>
          <boxGeometry args={[w, 0.08, p]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        {/* moldura luminosa (aberta do lado da taxiway) */}
        {[
          [0, -p / 2, w, 0.15],
          [-w / 2, 0, 0.15, p], [w / 2, 0, 0.15, p],
        ].map(([bx, bz, bw, bp], i) => (
          <mesh key={i} position={[bx, 0.1, bz]}>
            <boxGeometry args={[bw, 0.05, bp]} />
            <meshStandardMaterial ref={i === 0 ? borda : undefined} color="#2196f3" emissive="#2196f3" emissiveIntensity={1} />
          </mesh>
        ))}
        {/* estação de recarga na frente do robô */}
        <mesh position={[0, 0.7, -p / 2 - 0.45]} castShadow>
          <boxGeometry args={[1.6, 1.4, 0.6]} />
          <meshStandardMaterial color="#263238" />
        </mesh>
        <mesh position={[0, 1.05, -p / 2 - 0.14]}>
          <boxGeometry args={[0.9, 0.3, 0.02]} />
          <meshStandardMaterial color="#00e676" emissive="#00e676" emissiveIntensity={1.5} />
        </mesh>
        {/* cobertura */}
        {[-1, 1].map(lado => (
          <mesh key={lado} position={[lado * (w / 2 + 0.15), 1.4, -p / 2 + 0.3]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 2.8]} />
            <meshStandardMaterial color="#b0bec5" />
          </mesh>
        ))}
        <mesh position={[0, 2.85, -0.4]} rotation-x={0.12} castShadow>
          <boxGeometry args={[w + 0.8, 0.1, p * 0.8]} />
          <meshStandardMaterial color="#eceff1" />
        </mesh>
        <Rotulo position={[-w / 2 - 0.35, 0.12, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} tamanho={0.5} cor="#64b5f6">
          BASE DOCK
        </Rotulo>
      </group>
    </group>
  )
}

export function Torre({ sim }) {
  const vermelha = useRef()
  const verde = useRef()
  const luzVermelha = useRef()
  const luzVerde = useRef()

  useFrame(() => {
    const livre = sim.pistaLivre
    vermelha.current.emissiveIntensity = livre ? 0.05 : 2.5
    verde.current.emissiveIntensity = livre ? 2.5 : 0.05
    luzVermelha.current.intensity = livre ? 0 : 8
    luzVerde.current.intensity = livre ? 8 : 0
  })

  return (
    <group position={[40, 0, -19]}>
      {/* base e haste */}
      <mesh position={[0, 6, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.6, 12, 12]} />
        <meshStandardMaterial color="#eceff1" />
      </mesh>
      {/* cabine de vidro */}
      <mesh position={[0, 13, 0]} castShadow>
        <cylinderGeometry args={[2.6, 2, 2, 8]} />
        <meshStandardMaterial color="#4fc3f7" transparent opacity={0.55} metalness={0.6} roughness={0.1} />
      </mesh>
      <mesh position={[0, 14.2, 0]} castShadow>
        <cylinderGeometry args={[2.9, 2.9, 0.4, 8]} />
        <meshStandardMaterial color="#455a64" />
      </mesh>

      {/* Semáforo voltado para a pista */}
      <group position={[0, 9, 2.2]}>
        <mesh>
          <boxGeometry args={[3.6, 1.6, 0.4]} />
          <meshStandardMaterial color="#212121" />
        </mesh>
        <mesh position={[-0.85, 0, 0.25]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshStandardMaterial ref={vermelha} color="#b71c1c" emissive="#ff1744" />
        </mesh>
        <mesh position={[0.85, 0, 0.25]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshStandardMaterial ref={verde} color="#1b5e20" emissive="#00e676" />
        </mesh>
        <pointLight ref={luzVermelha} position={[-0.85, 0, 1.2]} color="#ff1744" distance={8} />
        <pointLight ref={luzVerde} position={[0.85, 0, 1.2]} color="#00e676" distance={8} />
        <Rotulo position={[-0.85, 1.15, 0.21]} tamanho={0.32} cor="#ffffff">FECHADA</Rotulo>
        <Rotulo position={[0.85, 1.15, 0.21]} tamanho={0.32} cor="#ffffff">LIVRE</Rotulo>
      </group>
    </group>
  )
}
