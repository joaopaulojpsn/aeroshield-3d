// Lógica do robô AeroShield (máquina de estados), separada da parte gráfica.
// Estados: DOCKED -> SAINDO -> ZIGZAG -> INTERVENCAO (aproximando / acao / voltando) -> ZIGZAG ... -> RETORNANDO -> DOCKED
import { CONFIG, TIPOS, CORES_STATUS } from './config'

const MAX_LOGS = 40
const PONTOS_GRAFICO = 60

const hora = () => new Date().toLocaleTimeString('pt-BR')

function log(sim, texto) {
  sim.logs.push({ hora: hora(), texto })
  if (sim.logs.length > MAX_LOGS) sim.logs.shift()
}

function criarObjeto(base, id) {
  const info = TIPOS[base.tipo]
  return {
    id,
    tipo: base.tipo,
    nome: info.nome,
    categoria: info.categoria,
    x: base.x,
    z: base.z,
    conf: base.conf,
    estado: 'ativo', // ativo | detectado | coletando | coletado | fugindo | dispersado
    anim: 0,         // progresso das animações (0..1 na coleta, segundos na fuga)
  }
}

function objetosIniciais() {
  return CONFIG.objetosIniciais.map((o, i) => criarObjeto(o, i))
}

function objetosAleatorios() {
  const tipos = ['parafuso', 'pneu', 'fauna', 'parafuso', 'pneu']
  const lista = []
  for (const tipo of tipos) {
    let x, z, tentativas = 0
    // garante distância mínima entre objetos
    do {
      x = 8 + Math.random() * 46
      z = -9 + Math.random() * 18
      tentativas++
    } while (tentativas < 50 && lista.some(o => Math.hypot(o.x - x, o.z - z) < 8))
    const conf = (90 + Math.random() * 9.5).toFixed(1) + '%'
    lista.push(criarObjeto({ tipo, x, z, conf }, lista.length))
  }
  return lista
}

export function criarSimulacao() {
  const sim = {
    fase: 'DOCKED',
    subfase: null,
    pistaLivre: false,
    robo: { x: CONFIG.dock.x, z: CONFIG.dock.z, rot: CONFIG.rotDock, dirZ: 1, velocidade: 0 },
    rota: [],              // pontos de passagem (saída e retorno pela taxiway)
    objetos: objetosIniciais(),
    versaoObjetos: 0,      // muda quando a lista de objetos é recriada
    alvo: null,
    timer: 0,
    rotaZ: 0,              // Z do zigue-zague antes do desvio
    motivoRetorno: null,   // 'fim' | 'torre'
    tempo: 0,
    acumuladorGrafico: 0,
    grafico: Array(PONTOS_GRAFICO).fill(5),
    logs: [],
    contagem: { fod: 0, fauna: 0, varreduras: 0 },
  }
  log(sim, 'Sistema inicializado na Base Dock')
  log(sim, 'Aguardando sinal VERDE da torre...')
  return sim
}

// Move o robô em direção a (tx, tz). Retorna true quando chega.
function moverPara(sim, tx, tz, vel, dt, tolerancia = 0.15) {
  const r = sim.robo
  const dx = tx - r.x
  const dz = tz - r.z
  const d = Math.hypot(dx, dz)
  if (d <= tolerancia) { r.velocidade = 0; return true }
  const passo = Math.min(vel * dt, d)
  r.x += (dx / d) * passo
  r.z += (dz / d) * passo
  r.rot = suavizarAngulo(r.rot, Math.atan2(-dz, dx), dt * 6)
  r.velocidade = vel
  return false
}

function suavizarAngulo(atual, alvo, fator) {
  let diff = alvo - atual
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return atual + diff * Math.min(1, fator)
}

// Segue a lista de pontos sim.rota. Retorna true quando chega ao último.
function seguirRota(sim, vel, dt) {
  while (sim.rota.length) {
    const [px, pz] = sim.rota[0]
    const ultimo = sim.rota.length === 1
    if (!moverPara(sim, px, pz, vel, dt, ultimo ? 0.2 : 0.6)) return false
    sim.rota.shift()
  }
  return true
}

function iniciarSaida(sim) {
  const { entradaPista: e, inicioVarredura: i } = CONFIG
  sim.fase = 'SAINDO'
  sim.rota = [[e.x, e.z], [i.x, i.z]]
  log(sim, 'Saindo da Base Dock pela taxiway.')
}

function iniciarRetorno(sim, motivo) {
  const { entradaPista: e, dock: d } = CONFIG
  sim.fase = 'RETORNANDO'
  sim.subfase = null
  sim.rota = [[e.x, e.z], [d.x, d.z]]
  sim.motivoRetorno = motivo
  if (sim.alvo && sim.alvo.estado === 'detectado') sim.alvo.estado = 'ativo'
  sim.alvo = null
}

// ---------- Ações chamadas pela interface ----------

export function alternarSinalTorre(sim) {
  sim.pistaLivre = !sim.pistaLivre
  if (sim.pistaLivre) {
    log(sim, 'Torre: Pista LIVRE! Operação autorizada.')
    if (sim.fase === 'DOCKED') iniciarSaida(sim)
    else if (sim.fase === 'RETORNANDO') log(sim, 'Robô retornando — nova varredura ao chegar no Dock.')
  } else {
    log(sim, 'Torre: Pista FECHADA. Ordem de parada emitida.')
    if (sim.fase === 'ZIGZAG' || sim.fase === 'SAINDO') {
      iniciarRetorno(sim, 'torre')
      log(sim, 'Interrompendo operação e retornando à base.')
    } else if (sim.fase === 'INTERVENCAO' && sim.subfase === 'aproximando') {
      iniciarRetorno(sim, 'torre')
      log(sim, 'Aproximação abortada. Retornando à base.')
    } else if (sim.fase === 'INTERVENCAO') {
      log(sim, 'Finalizando ação em andamento antes de retornar.')
    }
  }
}

function iniciarVarredura(sim) {
  sim.fase = 'ZIGZAG'
  sim.robo.dirZ = 1
  sim.contagem.varreduras++
  log(sim, `Iniciando varredura #${sim.contagem.varreduras} em zigue-zague.`)
}

export function reposicionarObjetos(sim) {
  if (sim.fase !== 'DOCKED') {
    log(sim, 'Reposicionamento só é permitido com o robô no Dock.')
    return
  }
  sim.objetos = objetosAleatorios()
  sim.versaoObjetos++
  log(sim, `Novos objetos posicionados na pista (${sim.objetos.length}).`)
}

export function resetar(sim) {
  const nova = criarSimulacao()
  nova.versaoObjetos = sim.versaoObjetos + 1
  Object.assign(sim, nova)
}

// ---------- Atualização a cada frame ----------

export function atualizar(sim, dtReal, multiplicador = 1) {
  const dt = Math.min(dtReal, 0.05) * multiplicador
  sim.tempo += dt
  const r = sim.robo

  // animações de objetos independentes do estado do robô
  for (const o of sim.objetos) {
    if (o.estado === 'fugindo') {
      o.anim += dt
      if (o.anim >= CONFIG.tempoFuga) o.estado = 'dispersado'
    }
  }

  let leituraSensor = 5

  if (sim.fase === 'DOCKED') {
    r.velocidade = 0
    r.rot = suavizarAngulo(r.rot, CONFIG.rotDock, dt * 4)

  } else if (sim.fase === 'SAINDO') {
    leituraSensor = 15
    if (seguirRota(sim, CONFIG.velocidadeRetorno, dt)) iniciarVarredura(sim)

  } else if (sim.fase === 'ZIGZAG') {
    leituraSensor = 25
    r.x += CONFIG.velocidadeX * dt
    r.z += CONFIG.velocidadeZ * r.dirZ * dt
    if (r.z > CONFIG.limiteZ) { r.z = CONFIG.limiteZ; r.dirZ = -1 }
    if (r.z < -CONFIG.limiteZ) { r.z = -CONFIG.limiteZ; r.dirZ = 1 }
    r.rot = suavizarAngulo(r.rot, Math.atan2(-CONFIG.velocidadeZ * r.dirZ, CONFIG.velocidadeX), dt * 5)
    r.velocidade = Math.hypot(CONFIG.velocidadeX, CONFIG.velocidadeZ)

    detectar(sim, CONFIG.raioDeteccao)

    if (sim.fase === 'ZIGZAG' && r.x > CONFIG.xFimVarredura) {
      // verificação final: algum objeto escapou do sensor durante a varredura?
      if (detectar(sim, Infinity, 'Verificação final — alvo remanescente: ')) {
        // vai até ele antes de encerrar
      } else {
        log(sim, 'Fim da pista. Varredura concluída.')
        sim.pistaLivre = false
        iniciarRetorno(sim, 'fim')
      }
    }

  } else if (sim.fase === 'INTERVENCAO') {
    const alvo = sim.alvo
    const ehFOD = alvo.categoria === 'FOD'

    if (sim.subfase === 'aproximando') {
      leituraSensor = 60
      // FOD: passa por cima (eletroímã fica embaixo). Fauna: para a uma distância segura.
      if (ehFOD) {
        if (moverPara(sim, alvo.x, alvo.z, CONFIG.velocidadeAproximacao, dt, 0.2)) {
          sim.subfase = 'acao'; sim.timer = 0
          alvo.estado = 'coletando'
          log(sim, 'Eletroímã de coleta ATIVADO.')
        }
      } else {
        const d = Math.hypot(alvo.x - r.x, alvo.z - r.z)
        if (d <= CONFIG.distanciaLaser) {
          r.velocidade = 0
          sim.subfase = 'acao'; sim.timer = 0
          log(sim, 'Disparando feixe óptico estroboscópico.')
        } else {
          moverPara(sim, alvo.x, alvo.z, CONFIG.velocidadeAproximacao, dt)
        }
      }

    } else if (sim.subfase === 'acao') {
      leituraSensor = 80
      sim.timer += dt
      if (ehFOD) {
        alvo.anim = Math.min(1, sim.timer / CONFIG.tempoColeta)
        if (sim.timer >= CONFIG.tempoColeta) {
          alvo.estado = 'coletado'
          sim.contagem.fod++
          log(sim, `${alvo.nome} removido da pista.`)
          finalizarAcao(sim)
        }
      } else {
        // mantém o robô apontado para a ave
        r.rot = suavizarAngulo(r.rot, Math.atan2(-(alvo.z - r.z), alvo.x - r.x), dt * 8)
        if (sim.timer >= CONFIG.tempoDissuasao) {
          alvo.estado = 'fugindo'
          alvo.anim = 0
          sim.contagem.fauna++
          log(sim, 'Fauna dispersada com sucesso.')
          finalizarAcao(sim)
        }
      }

    } else if (sim.subfase === 'voltando') {
      leituraSensor = 30
      // o sensor continua ligado enquanto o robô volta para a rota
      if (detectar(sim, CONFIG.raioDeteccao)) return atualizarGrafico(sim, dt, 60)
      // retorna suavemente ao Z da rota original, continuando a avançar
      if (moverPara(sim, r.x + 1.2, sim.rotaZ, CONFIG.velocidadeAproximacao, dt, 0.25) ||
          Math.abs(r.z - sim.rotaZ) < 0.25) {
        sim.fase = 'ZIGZAG'
        sim.subfase = null
        sim.alvo = null
        log(sim, 'Rota de varredura retomada.')
      }
    }

  } else if (sim.fase === 'RETORNANDO') {
    leituraSensor = 15
    if (seguirRota(sim, CONFIG.velocidadeRetorno, dt)) {
      sim.fase = 'DOCKED'
      log(sim, 'Robô acoplado à Base Dock. Recarregando.')
      if (sim.motivoRetorno === 'fim') {
        // nova rodada: objetos voltam para a pista
        for (const o of sim.objetos) { o.estado = 'ativo'; o.anim = 0 }
        sim.versaoObjetos++
      }
      sim.motivoRetorno = null
      if (sim.pistaLivre) iniciarSaida(sim)
    }
  }

  atualizarGrafico(sim, dt, leituraSensor)
}

// gráfico do osciloscópio (amostra a cada 50 ms de simulação)
function atualizarGrafico(sim, dt, leituraSensor) {
  sim.acumuladorGrafico += dt
  while (sim.acumuladorGrafico >= 0.05) {
    sim.acumuladorGrafico -= 0.05
    const ruido = Math.sin(sim.tempo * 30) * 3 + (Math.random() - 0.5) * 3
    sim.grafico.push(Math.max(0, leituraSensor + ruido))
    if (sim.grafico.length > PONTOS_GRAFICO) sim.grafico.shift()
  }
}

// Procura o objeto ativo mais próximo dentro do raio. Se achar, trava nele.
function detectar(sim, raio, prefixo = 'IA identificou: ') {
  const r = sim.robo
  let melhor = null, menor = raio
  for (const o of sim.objetos) {
    if (o.estado !== 'ativo') continue
    const d = Math.hypot(o.x - r.x, o.z - r.z)
    if (d < menor) { menor = d; melhor = o }
  }
  if (!melhor) return false
  // grava o Z do zigue-zague só se estava varrendo (não ao emendar alvos)
  if (sim.fase === 'ZIGZAG') sim.rotaZ = r.z
  melhor.estado = 'detectado'
  sim.alvo = melhor
  sim.fase = 'INTERVENCAO'
  sim.subfase = 'aproximando'
  sim.timer = 0
  log(sim, `${prefixo}${melhor.nome} (${melhor.categoria}) — confiança ${melhor.conf}`)
  return true
}

function finalizarAcao(sim) {
  if (!sim.pistaLivre) {
    iniciarRetorno(sim, 'torre')
    log(sim, 'Pista fechada pela torre. Retornando à base.')
  } else {
    sim.subfase = 'voltando'
  }
}

// ---------- Texto e cor do status ----------

export function obterStatus(sim) {
  switch (sim.fase) {
    case 'DOCKED':
      return { texto: 'DOCKED — Robô na base. Aguardando pista livre.', cor: CORES_STATUS.DOCKED }
    case 'SAINDO':
      return { texto: 'SAINDO DA BASE — Taxiando até a cabeceira da pista', cor: CORES_STATUS.SAINDO }
    case 'ZIGZAG':
      return { texto: 'OPERAÇÃO ATIVA — Varredura em zigue-zague', cor: CORES_STATUS.ZIGZAG }
    case 'RETORNANDO':
      return {
        texto: sim.motivoRetorno === 'fim'
          ? 'VARREDURA CONCLUÍDA — Retornando ao Dock'
          : 'ORDEM DE PARADA — Retornando à base',
        cor: CORES_STATUS.RETORNANDO,
      }
    case 'INTERVENCAO': {
      if (sim.subfase === 'aproximando')
        return { texto: `ALVO TRAVADO — Desviando até ${sim.alvo.nome}`, cor: CORES_STATUS.APROXIMANDO }
      if (sim.subfase === 'acao')
        return sim.alvo.categoria === 'FOD'
          ? { texto: 'RECOLHIMENTO — Eletroímã de coleta ativo', cor: CORES_STATUS.COLETA }
          : { texto: 'DISSUASÃO — Feixe óptico estroboscópico', cor: CORES_STATUS.DISSUASAO }
      return { texto: 'RETOMANDO ROTA — Voltando ao zigue-zague', cor: CORES_STATUS.ZIGZAG }
    }
    default:
      return { texto: '', cor: '#fff' }
  }
}

// Cópia leve do estado para a interface React (HUD)
export function capturar(sim) {
  return {
    fase: sim.fase,
    subfase: sim.subfase,
    pistaLivre: sim.pistaLivre,
    status: obterStatus(sim),
    logs: sim.logs.slice(),
    grafico: sim.grafico.slice(),
    versaoObjetos: sim.versaoObjetos,
    contagem: { ...sim.contagem },
    restantes: sim.objetos.filter(o => o.estado === 'ativo' || o.estado === 'detectado').length,
  }
}
