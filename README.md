# AeroShield Robotics V4 — Simulador 3D

Robô autônomo de patrulha de pista: detecta FOD (parafusos, pedaços de pneu) e fauna (quero-quero),
recolhe os detritos com eletroímã e espanta as aves com laser estroboscópico. Só opera com a pista
liberada pela torre de controle.

Feito com React + Vite + Three.js (@react-three/fiber e @react-three/drei).

**Acesse online:** https://joaopaulojpsn.github.io/aeroshield-3d/

## Créditos

Projeto da disciplina **MB-251 Complexidade da Inovação** — Prof. **Lucas Abdala**,
Instituto Tecnológico de Aeronáutica (**ITA**).

| Função | Nome |
|---|---|
| Desenvolvedor | João Paulo Nogueira |
| Idealizador do projeto | Major AV Vitor CORRADI |
| Integrantes do grupo | Oswaldo Junior · Mario H Trentim |

## Como rodar

Pré-requisito: Node.js 20 ou mais novo (https://nodejs.org).

```bash
npm install     # baixa as dependências (só na primeira vez)
npm run dev     # abre em http://localhost:5173
```

## Controles

| Ação | Botão | Tecla |
|---|---|---|
| Liberar / fechar pista | Alterar sinal da torre | Espaço |
| Câmera orbital (arrastar para girar, roda do mouse para zoom) | Orbital | 1 |
| Câmera seguindo o robô | Seguir robô | 2 |
| Visão superior | Superior | 3 |
| Novos objetos em posições aleatórias (com o robô no Dock) | Reposicionar objetos | — |
| Velocidade da simulação | slider | — |

## Estrutura

```
src/
  config.js           velocidades, raio do sensor, tempos, posições iniciais
  simulacao.js        máquina de estados do robô (sem nada gráfico)
  App.jsx             junta a cena 3D e o HUD
  index.css           estilos do HUD
  components/
    Cenario.jsx       pista, Base Dock e torre com semáforo
    Robo.jsx          modelo do robô, cone do sensor, eletroímã e laser
    Objetos.jsx       parafuso, pneu, quero-quero, bounding box e rótulo da IA
    Camera.jsx        modos de câmera
    HUD.jsx           status, métricas, osciloscópio do LiDAR e log
    Rotulo.jsx        textos 3D (funcionam offline)
```

## Máquina de estados

```
DOCKED --(torre libera)--> ZIGZAG --(sensor detecta)--> INTERVENCAO
                             ^                           aproximando -> acao -> voltando
                             |___________________________________________________|
ZIGZAG --(fim da pista ou torre fecha)--> RETORNANDO --> DOCKED
```

- Antes de encerrar, o robô faz uma verificação final e vai até qualquer objeto que tenha escapado do sensor.
- Se a torre fechar durante uma coleta, o robô termina a ação e depois volta para a base.

## Gerar versão para apresentar

```bash
npm run build     # cria a pasta dist/
npm run preview   # serve a versão final em http://localhost:4173
```

## Licença

Código aberto para estudo e reutilização sob a [licença MIT](LICENSE),
desde que mantidos os créditos do desenvolvedor e do grupo.
