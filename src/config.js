// Configurações gerais do simulador AeroShield 3D
// Unidades em "metros" do mundo 3D. Eixo X = comprimento da pista, eixo Z = largura.

export const CONFIG = {
  pista: {
    xInicio: -8,      // começo do asfalto
    xFim: 64,         // fim do asfalto
    largura: 26,      // largura total do asfalto
  },

  limiteZ: 10,        // o zigue-zague oscila entre -10 e +10 (bordas da varredura)
  xFimVarredura: 58,  // ao passar deste X a varredura é concluída

  // Base Dock fora da pista, na grama ao lado da torre de controle
  dock: { x: 31, z: -19 },
  rotDock: Math.PI / 2,               // robô estacionado de frente para o carregador
  entradaPista: { x: 31, z: -11 },    // ponto onde a taxiway encontra a pista
  inicioVarredura: { x: -4, z: -10 }, // começo do zigue-zague (cabeceira da pista)

  // Velocidades (m/s)
  velocidadeX: 1.4,           // avanço horizontal da varredura
  velocidadeZ: 3.2,           // oscilação lateral do zigue-zague
  velocidadeAproximacao: 4,   // ao desviar até um alvo
  velocidadeRetorno: 6,       // deslocamentos entre o Dock e a pista

  // Sensores
  raioDeteccao: 11,           // alcance do LiDAR/câmera
  distanciaLaser: 5,          // distância de onde o laser é disparado contra a fauna

  // Tempos dos atuadores (segundos)
  tempoColeta: 2,             // eletroímã ligado
  tempoDissuasao: 2.4,        // laser estroboscópico
  tempoFuga: 3,               // animação da ave voando para longe

  // Objetos iniciais (convertidos das coordenadas do MVP 2D)
  objetosIniciais: [
    { tipo: 'parafuso', x: 17.7, z: -7.2, conf: '97.4%' },
    { tipo: 'fauna',    x: 31.0, z: 8.6,  conf: '94.1%' },
    { tipo: 'pneu',     x: 47.8, z: -2.6, conf: '98.9%' },
  ],
}

export const TIPOS = {
  parafuso: { nome: 'Parafuso', categoria: 'FOD' },
  pneu:     { nome: 'Pedaço de Pneu', categoria: 'FOD' },
  fauna:    { nome: 'Quero-quero', categoria: 'Fauna' },
}

export const CORES_STATUS = {
  DOCKED: '#ef5350',
  SAINDO: '#42a5f5',
  ZIGZAG: '#66bb6a',
  APROXIMANDO: '#ffa726',
  COLETA: '#e53935',
  DISSUASAO: '#ce93d8',
  RETORNANDO: '#42a5f5',
}
