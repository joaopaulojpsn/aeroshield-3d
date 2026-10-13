// Interface sobreposta: status, controles, log de operações e osciloscópio do LiDAR
import { useEffect, useRef } from 'react'

const FASES = {
  DOCKED: 'Na base',
  SAINDO: 'Taxiando',
  ZIGZAG: 'Varredura',
  INTERVENCAO: 'Intervenção',
  RETORNANDO: 'Retornando',
}

export function HUD({ estado, camera, setCamera, velocidade, setVelocidade, onTorre, onReposicionar, onResetar }) {
  const { status, pistaLivre, logs, grafico, contagem, fase, restantes } = estado

  return (
    <div className="hud">
      {/* Barra superior */}
      <header className="painel barra-status">
        <div className="marca">
          <strong>AeroShield</strong> Robotics <span>V4 · 3D</span>
        </div>
        <div className="status" style={{ '--cor': status.cor }}>
          <span className="ponto" />
          {status.texto}
        </div>
        <div className={`semaforo ${pistaLivre ? 'livre' : ''}`}>
          <span className="luz vermelha" />
          <span className="luz verde" />
          {pistaLivre ? 'PISTA LIVRE' : 'PISTA FECHADA'}
        </div>
      </header>

      {/* Painel lateral */}
      <aside className="painel lateral">
        <section className="metricas">
          <Metrica rotulo="Fase" valor={FASES[fase]} />
          <Metrica rotulo="FOD coletados" valor={contagem.fod} />
          <Metrica rotulo="Fauna dispersada" valor={contagem.fauna} />
          <Metrica rotulo="Alvos na pista" valor={restantes} />
        </section>

        <h3>Leitura do LiDAR</h3>
        <Osciloscopio dados={grafico} />

        <h3>Log de operações</h3>
        <Log logs={logs} />

        <Creditos />
      </aside>

      {/* Controles */}
      <footer className="painel controles">
        <button className="btn primario" onClick={onTorre}>
          Alterar sinal da torre
        </button>
        <button className="btn" onClick={onReposicionar} disabled={fase !== 'DOCKED'} title="Disponível com o robô no Dock">
          Reposicionar objetos
        </button>
        <button className="btn" onClick={onResetar}>Resetar</button>

        <div className="grupo-camera">
          {[['orbital', 'Orbital'], ['seguir', 'Seguir robô'], ['topo', 'Superior']].map(([id, nome]) => (
            <button key={id} className={`chip ${camera === id ? 'ativo' : ''}`} onClick={() => setCamera(id)}>
              {nome}
            </button>
          ))}
        </div>

        <label className="velocidade">
          Velocidade {velocidade.toFixed(1)}×
          <input type="range" min="0.25" max="4" step="0.25" value={velocidade}
            onChange={e => setVelocidade(Number(e.target.value))} />
        </label>
      </footer>
    </div>
  )
}

// Créditos do projeto (rodapé do painel lateral)
function Creditos() {
  return (
    <footer className="creditos">
      <p className="disciplina">
        MB-251 Complexidade da Inovação · Prof. Lucas Abdala · ITA
      </p>
      <p><span>Desenvolvedor</span> João Paulo Nogueira</p>
      <p><span>Idealizador</span> Major AV Vitor CORRADI</p>
      <p><span>Equipe</span> Oswaldo Junior · Mario H Trentim</p>
    </footer>
  )
}

function Metrica({ rotulo, valor }) {
  return (
    <div className="metrica">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  )
}

function Osciloscopio({ dados }) {
  const L = 260, A = 80
  const pontos = dados.map((v, i) => `${(i / (dados.length - 1)) * L},${A - (v / 100) * A}`).join(' ')
  return (
    <svg className="osciloscopio" viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" x2={L} y1={A * f} y2={A * f} className="grade" />
      ))}
      <polyline points={pontos} className="sinal" />
    </svg>
  )
}

function Log({ logs }) {
  const ref = useRef()
  const ultimo = logs[logs.length - 1]?.texto
  // rola automaticamente para a mensagem mais recente
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs.length, ultimo])

  return (
    <ol className="log" ref={ref}>
      {logs.map((l, i) => (
        <li key={i}>
          <time>{l.hora}</time>
          {l.texto}
        </li>
      ))}
    </ol>
  )
}
