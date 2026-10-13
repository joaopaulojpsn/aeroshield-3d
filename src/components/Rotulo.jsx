// Texto 3D desenhado num canvas (não depende de baixar fontes da internet)
import { useMemo, useEffect } from 'react'
import * as THREE from 'three'

export function Rotulo({ children, tamanho = 0.5, cor = '#ffffff', negrito = true, ...props }) {
  const { textura, proporcao } = useMemo(() => {
    const texto = String(children)
    const escala = 128
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const fonte = `${negrito ? 'bold ' : ''}${escala}px system-ui, Arial, sans-serif`
    ctx.font = fonte
    const largura = Math.ceil(ctx.measureText(texto).width) + 16
    canvas.width = largura
    canvas.height = escala * 1.3
    ctx.font = fonte
    ctx.fillStyle = cor
    ctx.textBaseline = 'middle'
    ctx.fillText(texto, 8, canvas.height / 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return { textura: tex, proporcao: canvas.width / canvas.height }
  }, [children, cor, negrito])

  useEffect(() => () => textura.dispose(), [textura])

  return (
    <mesh {...props}>
      <planeGeometry args={[tamanho * 1.3 * proporcao, tamanho * 1.3]} />
      <meshBasicMaterial map={textura} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
