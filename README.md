# Problema das N Rainhas

Tabuleiro interativo para explorar o problema das N rainhas **manualmente**. O usuário escolhe N, coloca as rainhas e as arrasta livremente pelo tabuleiro. O app detecta e mostra os conflitos, mas **não resolve nada**: não há backtracking, heurística, dica ou contagem de soluções.

## Documentação

| Arquivo | Conteúdo |
| --- | --- |
| [`ARQUITETURA.md`](ARQUITETURA.md) | Organização do projeto, componentes, representação do tabuleiro e das rainhas, verificação de conflitos e diagrama da arquitetura |
| [`PROMPTS.md`](PROMPTS.md) | Registro dos principais prompts usados com a IA e as decisões que cada um produziu |

## Como rodar

Único pré-requisito: [Node.js](https://nodejs.org) `^20.19.0` ou `>=22.12.0` — exigência do Vite 8. O projeto foi desenvolvido no Node 24. Confira com `node --version`.

```bash
npm install     # só na primeira vez, e depois de cada git pull que mude as dependências
npm run dev
```

Abra <http://localhost:5173>. O servidor tem hot reload — salvar um arquivo atualiza a página sozinho. Para parar, `Ctrl+C` no terminal.

### Outros comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em `localhost:5173` |
| `npm test` | Roda os testes da lógica de conflito |
| `npm run test:watch` | Testes em modo watch, reexecutando a cada alteração |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve o conteúdo de `dist/` para conferir o build |
| `npm run lint` | Lint com oxlint |
| `npm run package:win` | Gera o pacote desktop "clique e jogue" em `ClickAndGo/` (ver seção abaixo) |

Tudo é local: as dependências ficam em `node_modules/` dentro da pasta do projeto e nada é instalado globalmente. Para remover o projeto por completo, basta apagar a pasta.

### Em outra máquina

```bash
git clone https://github.com/erik-gastao/ProblemaDasNRainhas.git
cd ProblemaDasNRainhas
npm install
npm run dev
```

`node_modules/` e `dist/` não são versionados. O `package-lock.json` é, e é ele que faz o `npm install` reproduzir exatamente as mesmas versões de dependência.

## Como usar o tabuleiro

Na tela inicial, escolha o número de rainhas com o slider ou pelos atalhos (4, 6, 8, 12, 16). O valor define o tamanho do tabuleiro: **N rainhas em um tabuleiro N × N**, com N entre 1 e 16.

Depois de começar, a barra no topo redimensiona o tabuleiro a qualquer momento. As rainhas que continuam dentro do novo grid permanecem onde estavam; ao encolher, saem as que ficaram fora e, se ainda sobrarem mais que N, as mais recentes caem. Redimensionar limpa o histórico de desfazer, já que os estados anteriores pertencem a um tabuleiro de outro tamanho.

### Mouse e toque

| Ação | Resultado |
| --- | --- |
| Clique numa casa vazia | Coloca uma rainha, até o limite de N |
| Clique numa rainha | Remove a rainha |
| Arraste uma rainha | Move para qualquer casa vazia |

O arrasto começa depois de 5 px de movimento. Abaixo disso o gesto conta como clique, o que evita remover uma rainha sem querer ao tentar movê-la.

### Teclado

| Tecla | Resultado |
| --- | --- |
| Setas, `Home`, `End` | Movem o foco entre as casas |
| `Enter` ou `Espaço` numa casa vazia | Coloca uma rainha |
| `Enter` numa rainha | Seleciona a rainha |
| `Enter` numa casa vazia com rainha selecionada | Move a rainha para lá |
| `Enter` na rainha já selecionada | Remove a rainha |
| `Esc` | Cancela a seleção |

### Botões

**Desfazer** volta um passo (histórico de até 50 jogadas). **Limpar** esvazia o tabuleiro.

## Regras de movimento e de conflito

Duas regras diferentes, e é importante não confundi-las:

- **Movimento é livre.** A rainha vai para qualquer casa vazia, ignorando linhas e diagonais. O problema das N rainhas se importa com a posição final, não com o caminho percorrido.
- **Conflito segue o xadrez.** Duas rainhas se atacam quando estão na mesma linha, na mesma coluna, ou quando `|linha₁ − linha₂| == |coluna₁ − coluna₂|` (diagonal). Distância não importa e nenhuma peça bloqueia o ataque.

Posições inválidas são permitidas de propósito. Ao criar um conflito, as rainhas envolvidas ficam vermelhas, uma linha é desenhada ligando cada par que se ataca, e o painel lateral lista os pares em notação de xadrez (`b3 x d1 · diagonal`). Quando as N rainhas estão no tabuleiro sem nenhum conflito, aparece um aviso verde.

As casas são nomeadas como no xadrez: colunas `a` a `p` da esquerda para a direita, linhas numeradas de baixo para cima, de `1` até `N`.

## Versão desktop (clique e jogue)

Pra distribuir o app pra alguém sem Node instalado, sem terminal e sem
instalar nada:

```bash
npm run package:win
```

Gera `ClickAndGo/`, uma pasta autocontida com o build de produção, um
runtime Node portátil (baixado de nodejs.org na primeira vez e cacheado em
`.cache/`), o servidor estático `serve-static.cjs` e um atalho `Jogar.bat`.
Compacte essa pasta e distribua — quem receber só extrai e clica em
`Jogar.bat`: sobe um servidor local e abre o navegador padrão sozinho.
Fechar a janela do terminal encerra o jogo.

**Por que precisa de servidor, e não abrir `dist/index.html` direto no
navegador?** O build do Vite usa `<script type="module">`, e Chrome/Edge
bloqueiam módulos ES carregados via `file://` por política de CORS —
funcionaria só no Firefox. Servir por `http://localhost` resolve os dois
problemas de uma vez (caminhos absolutos do build e o bloqueio de módulos).

**Por que não Tauri ou Electron?** Foi a primeira tentativa (registrada em
`PROMPTS.md`, seção 9) — um app nativo de verdade, com instalador `.exe` e
acesso a APIs do sistema. Abandonada porque exige toolchain Rust + MSVC Build
Tools + Windows SDK instalados na máquina de quem builda; nesta máquina o SDK
estava incompleto, e completá-lo pediu elevação (UAC) e download de ~1–2 GB
só para compilar. O empacotador com Node portátil não compila nada: baixa um
`.zip` oficial e copia arquivos, então funciona em qualquer Windows sem
pré-requisito. A troca vale a pena porque o app hoje não usa nenhum recurso
nativo (filesystem, notificações etc.) — é HTML/JS servido localmente. Se
isso mudar quando entrarem os algoritmos de otimização (ver seção "Ponto de
extensão" em `ARQUITETURA.md`), Tauri continua sendo o caminho natural pra
evoluir, e nada na estrutura atual do app impede migrar pra lá depois.

## Estrutura

```
src/
  types.ts                  Queen, Square, ConflictPair, limites de N
  logic/
    conflicts.ts            detecção de conflito — funções puras, sem React
    board.ts                adapta as rainhas quando o tabuleiro muda de tamanho
    coords.ts               nomes de casas no estilo xadrez
    conflicts.test.ts       testes da detecção de conflito
    board.test.ts           testes do redimensionamento
  hooks/
    useBoard.ts             estado do tabuleiro, histórico de desfazer
  components/
    BoardSetup.tsx          tela de escolha de N
    SizeSlider.tsx          barra que redimensiona o tabuleiro
    Board.tsx               grid, pointer events, teclado, coordenadas
    BoardSquare.tsx         uma casa
    QueenPiece.tsx          peça em SVG
    ConflictLines.tsx       linhas ligando rainhas em conflito
    StatusPanel.tsx         contadores, lista de conflitos, instruções
  App.tsx                   alterna entre a tela inicial e o tabuleiro
scripts/
  serve-static.cjs          servidor estático sem dependências, usado no pacote desktop
  package-desktop.mjs       builda, baixa o Node portátil e monta release/
```

A detecção de conflito vive em `src/logic/`, separada da interface e sem nenhuma dependência de React. É código puro e testado, o que deixa o caminho aberto para um solver reaproveitá-la depois.

## Stack

React 19 · TypeScript · Vite 8 · Vitest · oxlint
