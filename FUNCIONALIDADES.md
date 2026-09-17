# Perguntas frequentes: como funciona por baixo

Este documento responde duas perguntas recorrentes sobre a implementação —
"como o botão de adicionar rainha nunca gera conflito?" e "o que muda cada
campo do painel do algoritmo genético?" — apontando exatamente onde cada peça
mora no código. Para a justificativa completa das escolhas do AG, ver
[`SolutionPurpose.md`](./SolutionPurpose.md); para a arquitetura geral, ver
[`ARQUITETURA.md`](./ARQUITETURA.md).

## 1. Como o botão "Adicionar rainha" evita conflito

Não é sorte: existe uma cadeia de três estratégias, em ordem de preferência,
implementada em `src/logic/board.ts` e consumida por `addQueen` em
`src/hooks/useBoard.ts:61-71`.

```ts
// src/hooks/useBoard.ts:61
const addQueen = useCallback(() => {
  apply((queens) => {
    if (queens.length >= n) return null;
    let pool = correctSquares(queens, n);
    if (pool.length === 0) pool = safeSquares(queens, n);
    if (pool.length === 0) pool = emptySquares(queens, n);
    if (pool.length === 0) return null;
    const square = pool[Math.floor(Math.random() * pool.length)];
    nextId.current += 1;
    return [...queens, { id: `q${nextId.current}`, ...square }];
  });
}, [apply, n]);
```

Sorteia uma casa aleatória dentro do **primeiro pool não vazio**, dos três
abaixo.

### 1.1 Casas "corretas" — `correctSquares` (`board.ts:39-43`)

```ts
export function correctSquares(queens: Queen[], n: number): Square[] {
  return safeSquares(queens, n).filter((square) =>
    canComplete([...queens, { id: '', ...square }], n),
  );
}
```

Não basta a casa não conflitar agora — ela precisa deixar o tabuleiro
**completável**: precisa existir alguma forma de colocar as `n` rainhas
restantes sem que nenhuma ataque outra. Isso é verificado simulando a
colocação e rodando um backtracking clássico de N-rainhas,
`canComplete` em `src/logic/solver.ts:12-45`:

```ts
// src/logic/solver.ts
export function canComplete(queens: Queen[], n: number): boolean {
  const fixedCol = new Map<number, number>();      // linhas já ocupadas
  for (const q of queens) fixedCol.set(q.row, q.col);
  const usedCols = new Set(queens.map((q) => q.col));
  const cols: number[] = [];

  function fits(row: number, col: number): boolean { /* linha, coluna, diagonal */ }

  function backtrack(row: number): boolean {
    if (row === n) return true;
    const forced = fixedCol.get(row);
    if (forced !== undefined) {                     // linha já tem rainha: só valida
      if (!fits(row, forced)) return false;
      cols[row] = forced;
      return backtrack(row + 1);
    }
    for (let col = 0; col < n; col++) {              // linha livre: tenta cada coluna
      if (usedCols.has(col) || !fits(row, col)) continue;
      cols[row] = col;
      usedCols.add(col);
      if (backtrack(row + 1)) return true;
      usedCols.delete(col);
    }
    return false;
  }

  return backtrack(0);
}
```

Linhas já ocupadas ficam fixas; as demais tentam cada coluna livre, linha a
linha, com poda imediata em conflito de coluna ou diagonal. O algoritmo
assume que as rainhas recebidas já estão livres de conflito entre si — se não
estiverem, não existe solução possível e a busca sempre falha, o que empurra
naturalmente para o próximo nível.

### 1.2 Casas "seguras" — `safeSquares` (`board.ts:26-31`)

```ts
export function safeSquares(queens: Queen[], n: number): Square[] {
  return emptySquares(queens, n).filter((square) =>
    queens.every((q) => conflictBetween(q, { id: '', ...square }) === null),
  );
}
```

Fallback usado quando nenhuma casa correta existe. Reaproveita
`conflictBetween` de `src/logic/conflicts.ts:7-12` (mesma função que colore
rainhas de vermelho no tabuleiro): a casa não ataca nem é atacada por nenhuma
rainha atual, mas **pode** levar a um beco sem saída mais adiante — o
backtracking não é consultado aqui.

### 1.3 Casas livres — `emptySquares` (`board.ts:14-24`)

Último fallback, sem nenhuma checagem de conflito — só usado quando a
configuração atual **já tem** conflito entre rainhas (ex.: usuário colocou
manualmente duas na mesma linha), caso em que "correta" e "segura" vêm
sempre vazias.

### 1.4 Por que backtracking e não só checar conflito local

Checar conflito local (nível 1.2) garante que a rainha nova não ataca
ninguém *agora*, mas não garante que o resto do tabuleiro ainda seja
resolvível depois. Exemplo clássico em N=4: colocar a primeira rainha em
`(linha 0, coluna 0)` não conflita com nada (tabuleiro vazio), mas nenhuma das
duas soluções de 4 rainhas usa a coluna 0 na linha 0 — o tabuleiro morre ali.
`canComplete` simula o restante do problema para frente e descarta esse tipo
de escolha. Casos cobertos em `src/logic/solver.test.ts` e
`src/logic/board.test.ts` (bloco `describe('correctSquares', ...)`).

## 2. Campos do painel "Algoritmo genético"

Tudo em `src/components/GAPanel.tsx`. Divididos em **parâmetros** (você
escolhe, antes ou entre execuções) e **métricas** (o algoritmo calcula, uma
vez por geração).

### 2.1 Parâmetros

| Campo na UI | Prop / tipo | Padrão | Onde mora | O que muda ao mexer |
| --- | --- | --- | --- | --- |
| **População** | `params.populationSize` | 100 | `GAPanel.tsx:67-74` | Quantos genomas competem por geração. Maior = mais diversidade e busca mais ampla, porém mais lento por geração. Menor = rápido, mas convergência prematura mais fácil. |
| **Crossover pc** | `params.crossoverRate` | 0,8 (faixa 0,6–0,9) | `GAPanel.tsx:75-84` | Probabilidade de recombinar um par de pais em vez de cloná-los (`evolve.ts:77-80`). Alto = filhos quase sempre mistura nova; baixo = mais clones puros. |
| **Mutação pm** | `params.mutationRate` | 0,02 por gene | `GAPanel.tsx:85-94` | Probabilidade, por gene, de virar valor aleatório (`operators.ts:58-62`, `mutate`). É a única fonte de material genético novo depois da população inicial — crossover só recombina o que já existe. Baixo = estável, risco de travar em ótimo local; alto = ruído que destrói blocos bons e atrasa convergência. |
| **Max. gerações** | `params.maxGenerations` | 1000 | `GAPanel.tsx:95-102` | Teto de iterações antes de desistir se a aptidão máxima não for atingida. Sem elitismo (seção 2.3), então o teto pode ser alcançado mesmo perto da solução. |
| **Semente** | `params.seed` | editável | `GAPanel.tsx:103-111` | Inicializa o PRNG `mulberry32` (`random.ts:10-19`). Mesma semente + mesmos parâmetros reproduz a evolução gene por gene — é o que torna os experimentos comparáveis. |
| **Ger. por quadro** | `ga.speed` | 1 | `GAPanel.tsx:112-120` | **Não é parâmetro do algoritmo** — é velocidade de exibição: quantas gerações o modo visual consome por frame de animação (`useGA.ts:109-117`, `tick`). Só afeta a taxa de atualização da tela. |

### 2.2 Métricas (uma linha por geração, `GenerationStats` em `ga/types.ts:28-39`)

Calculadas dentro do gerador `evolve` (`src/logic/ga/evolve.ts:36-66`), exibidas em
`GAPanel.tsx:164-187`.

| Campo na UI | Fonte | O que é |
| --- | --- | --- |
| **Aptidão** | `current.best` | Fitness do melhor indivíduo da geração: pares de rainhas em paz, `C(n,2) − colisões` (`fitness.ts:9-11` e `:28-48`, `:55-57`). Mostrado como `best/optimum`. |
| **Diversidade** | `current.diversity` | Entropia média por gene (locus) na população, normalizada em `[0, 1]` (`diversity.ts:16-39`). Começa perto de 1 na população inicial aleatória e cai rumo a 0 conforme os genes convergem — é a métrica que **mede** convergência prematura, em vez de só sugeri-la pelo formato da curva. |
| **Média** | `current.average` | Fitness médio de toda a população naquela geração (`evolve.ts:39-45`, `sum / fitnesses.length`). |
| **Pior** | `current.worst` | Fitness do pior indivíduo daquela geração (`evolve.ts:41,50`). |

### 2.3 Por que a curva do melhor pode cair

Aviso que o próprio painel exibe (`GAPanel.tsx:233-238`): não há elitismo nem
hall of fame — substituição geracional é total (`evolve.ts:70-90`), então o
melhor indivíduo de uma geração pode simplesmente não ter filhos e desaparecer
na próxima. É decisão deliberada, documentada em
[`SolutionPurpose.md`](./SolutionPurpose.md#7-o-que-este-ag-deliberadamente-não-tem):
mostra o comportamento real do AG canônico, sem maquiar a curva.
