# Relatório: uso de algoritmo genético no problema das N rainhas

Relata a aplicação da técnica — fundamentação teórica, modelagem, implementação
e resultados experimentais medidos. Para a justificativa detalhada de cada
decisão de design ver [`SolutionPurpose.md`](./SolutionPurpose.md); para como
cada campo da interface funciona, com referência de linha no código, ver
[`FUNCIONALIDADES.md`](./FUNCIONALIDADES.md).

## 1. Resumo

Foi implementado um algoritmo genético (AG) canônico — seleção por roleta,
crossover de 1 ponto, mutação por gene, substituição geracional total, sem
elitismo — para buscar soluções do problema das N rainhas. O núcleo vive em
`src/logic/ga/`, é código puro (sem dependência de React ou DOM), determinístico
sob semente fixa, e é consumido tanto por um modo visual (uma execução, gerações
por quadro de animação) quanto por um modo lote (várias sementes, estatística).
Os experimentos, descritos na seção 6, mostram que o AG resolve com alta taxa
de sucesso (93%) tabuleiros pequenos (N=6 e N=8), mas a taxa despenca para 7%
em N=10 e chega a 0% em N=12 e N=16 nos parâmetros padrão — resultado
compatível com o crescimento combinatório do espaço de busca (`Nᴺ`).

## 2. Introdução e motivação

O problema das N rainhas — posicionar N rainhas num tabuleiro N×N sem que
nenhuma ataque outra — tem solução conhecida por construção direta em O(n)
para qualquer N ≥ 4, e o backtracking clássico resolve N=8 instantaneamente
(o próprio projeto usa um backtracking desse tipo para a colocação assistida
de rainha no modo manual, ver `src/logic/solver.ts`). Portanto **o AG não é
necessário para resolver o problema** — a escolha é didática e experimental,
não de desempenho.

O que torna o problema um bom banco de provas para um AG são quatro
propriedades reunidas ao mesmo tempo:

1. **Espaço de busca grande e combinatório** — nesta representação, `Nᴺ`
   configurações possíveis (16.777.216 só para N=8).
2. **Função de aptidão barata, natural e graduada** — "quantos pares de
   rainhas se atacam" é um número que decresce suavemente rumo ao ótimo, não
   um sim/não; é exatamente o gradiente que a seleção precisa escalar.
3. **Ótimo conhecido** — vale `C(N,2) = N(N−1)/2`, o que permite afirmar com
   certeza se o algoritmo encontrou a solução.
4. **Visualizável** — um cromossomo *é* um tabuleiro; dá pra assistir a
   população evoluindo casa por casa, não só num gráfico abstrato de aptidão.

O objetivo, portanto, não é "resolver o tabuleiro": é medir o comportamento do
AG e responder com dados perguntas como *"subir a taxa de mutação piora ou
melhora a taxa de sucesso?"*.

## 3. Fundamentação teórica

Um algoritmo genético é uma metaheurística de busca inspirada na seleção
natural: mantém uma **população** de soluções candidatas (**indivíduos**),
avalia cada uma por uma função de **aptidão**, e produz a geração seguinte
favorecendo estatisticamente os mais aptos na reprodução, através de
**seleção**, **crossover** (recombinação) e **mutação**. O ciclo se repete até
encontrar o ótimo ou esgotar um critério de parada.

Os operadores usados nesta implementação, todos na forma canônica descrita na
literatura de AG (e sem nenhuma variação heurística adicional):

| Operador | Forma usada | Onde |
| --- | --- | --- |
| Seleção | Roleta (*fitness-proportionate*) — cada indivíduo ocupa fatia proporcional à sua aptidão; o pior ainda tem chance não nula, o que preserva diversidade | `src/logic/ga/operators.ts:14-29`, `rouletteSelect` |
| Crossover | 1 ponto, com probabilidade `pc` — corte em `[1, N-1]` garante que os dois pais sempre contribuam com pelo menos um gene | `operators.ts:38-47`, `onePointCrossover` |
| Mutação | Por gene, com probabilidade `pm` — cada gene do filho tem chance independente de virar valor aleatório novo | `operators.ts:58-62`, `mutate` |
| Substituição | Geracional total — os filhos substituem a população inteira; nenhum indivíduo sobrevive por mérito próprio (sem elitismo) | `src/logic/ga/evolve.ts:70-90` |

## 4. Modelagem do problema

Mapeamento do vocabulário do AG para o problema (`SolutionPurpose.md` §3, e
tipos em `src/logic/ga/types.ts`):

| Termo do AG | No problema das N rainhas |
| --- | --- |
| Indivíduo | uma configuração inteira do tabuleiro |
| Cromossomo / genoma | vetor de N inteiros: `genoma[linha] = coluna` |
| Gene | uma linha do tabuleiro |
| Alelo | a coluna onde a rainha daquela linha está |
| Fenótipo | o desenho correspondente no tabuleiro (`Queen[]`) |
| População | conjunto de genomas vivos ao mesmo tempo (padrão: 100) |
| Geração | um ciclo completo: avaliar → selecionar → cruzar → mutar → substituir |
| Aptidão | pares de rainhas que **não** se atacam |

**Representação — vetor livre com codificação inteira.** `genoma[linha] =
coluna`, valores podem repetir (`src/logic/ga/genome.ts`). Uma linha por gene
elimina de saída o conflito de linha por construção — todo cromossomo gerado é
sintaticamente válido, sem precisar de reparo. É diferente da representação de
`Queen[]` usada no modo manual, que permite deliberadamente posições
inválidas (inclusive duas rainhas na mesma linha) para que o usuário *veja* o
conflito; a conversão entre as duas é trivial e vive em `genomeToQueens`.

**Função de aptidão.** `aptidão(genoma) = C(N,2) − colisões(genoma)`
(`src/logic/ga/fitness.ts:55-57`). Sempre ≥ 0, requisito da seleção por
roleta, e igual ao ótimo `C(N,2)` só quando não há nenhuma colisão. As
colisões são contadas em O(N) com três arrays de contadores (coluna, diagonal
descendente, diagonal ascendente) em vez de comparar todos os pares — troca
que só vale a pena aqui porque o AG precisa apenas do *número* de colisões,
não de *quais* pares colidem (`fitness.ts:13-27`).

## 5. Implementação

O núcleo é uma função geradora pura, `function* evolve(params)`
(`src/logic/ga/evolve.ts:27-92`), que produz (`yield`) as estatísticas de cada
geração. Ser puro e gerador é o que permite dois consumidores compartilharem
exatamente o mesmo algoritmo e consumirem o PRNG (`mulberry32`,
`src/logic/ga/random.ts`) na mesma ordem — condição necessária para que a
mesma semente reproduza a mesma evolução:

| Consumidor | Como consome | Para quê | Onde |
| --- | --- | --- | --- |
| Visual | um `yield` por quadro de animação, pausável, passo a passo | ver a população evoluindo, uma execução por vez | `src/hooks/useGA.ts` |
| Lote | consome tudo num `for...of` síncrono, sem render | rodar M execuções (M sementes) e tirar estatística | `src/logic/ga/run.ts`, `runBatch` |

A interface (`src/components/GAPanel.tsx`) expõe todos os parâmetros do AG
como editáveis — população, `pc`, `pm`, limite de gerações, semente — porque
eles são o próprio objeto de estudo do experimento, não valores fixos de
produção. Cada execução (parâmetros, resultado, série completa de gerações) é
persistida em IndexedDB (`src/storage/runsDb.ts`) para comparação posterior.

## 6. Metodologia experimental

Um AG é estocástico: a mesma configuração de parâmetros pode resolver N=8 em
40 gerações numa execução e falhar em 1000 na seguinte. Por isso nenhuma
conclusão é tirada de uma execução isolada — todo número desta seção vem do
**modo lote**, que roda a mesma configuração 30 vezes variando apenas a
semente (`runBatch(params, 30)`) e reporta taxa de sucesso, média e desvio
padrão do número de gerações até a solução (só entre os runs que resolveram).

Parâmetros fixos em todos os testes: população 100, `pc` = 0,8, limite de
1000 gerações, sementes 1 a 30. Único parâmetro variado entre linhas: `N`
(tamanho do tabuleiro) e, numa comparação isolada, `pm` (taxa de mutação).

## 7. Resultados

Números medidos nesta sessão, executando `runBatch` diretamente contra o
código atual do repositório (não são valores de exemplo — a reprodutibilidade
por semente garante que rodar de novo com os mesmos parâmetros reproduz
exatamente os mesmos números):

| N | `pm` | Resolvidos | Taxa | Média de gerações | Desvio | Tempo do lote |
| --- | --- | --- | --- | --- | --- | --- |
| 6 | 0,02 | 28/30 | 93% | 164 | 231 | 274 ms |
| 8 | 0,02 | 28/30 | 93% | 340 | 251 | 499 ms |
| 8 | 0,20 | 14/30 | 47% | 414 | 296 | 1070 ms |
| 10 | 0,02 | 2/30 | 7% | 433 | 162 | 1333 ms |
| 12 | 0,02 | 0/30 | 0% | — | — | 1502 ms |
| 16 | 0,02 | 0/30 | 0% | — | — | 1759 ms |

### 7.1 Efeito da taxa de mutação (N=8)

Subir `pm` de 0,02 para 0,20 **derruba a taxa de sucesso quase pela metade**
(93% → 47%) e aumenta a média de gerações até a solução (340 → 414). A
mutação alta demais destrói blocos genéticos bons assim que o crossover os
monta, o que atrasa e às vezes impede a convergência — comportamento esperado
da teoria (seção 3) e confirmado pelos números.

### 7.2 Efeito do tamanho do tabuleiro (`pm` fixo em 0,02)

A taxa de sucesso não decai suavemente: cai de **93% (N=8) para 7% (N=10)** e
para **0% em N=12 e N=16**, com os mesmos 1000 gerações e mesma população. É a
confirmação empírica de que o AG canônico, sem nenhum reforço (elitismo, hall
of fame, reinício, ajuste dinâmico de `pm`), **não escala** para tabuleiros
grandes — o espaço de busca cresce como `Nᴺ` (`16¹⁶ ≈ 1,8 × 10¹⁹` só para
N=16) e a pressão seletiva da roleta pura não é suficiente para compensar.
**Isto não é um defeito de implementação: é o resultado esperado e é o próprio
ponto do experimento.**

### 7.3 Desvio padrão e distribuição

Em todos os casos resolvidos o desvio padrão é da mesma ordem de grandeza da
média (ex.: N=8, `pm`=0,02 → média 340, desvio 251). A distribuição do número
de gerações até a solução é fortemente assimétrica: alguns runs resolvem em
poucas dezenas de gerações, outros só perto do limite. Reforça por que
qualquer afirmação sobre parâmetros exige um lote de execuções, nunca uma
execução isolada.

## 8. Discussão

**Convergência prematura e diversidade.** Sem elitismo, a curva do melhor
indivíduo pode cair entre gerações — o melhor de uma geração não
necessariamente tem filhos e sobrevive na seguinte (`evolve.ts:70-72`). A
métrica de **diversidade** (entropia média por gene, normalizada em `[0,1]`,
`src/logic/ga/diversity.ts`) é o que efetivamente mede a convergência
prematura, em vez de só sugeri-la pelo formato do gráfico: ela começa perto de
1 na população inicial aleatória e cai rumo a 0 conforme os genes se
uniformizam — quando isso acontece antes do ótimo ser atingido, a população
ficou homogênea demais para a mutação sozinha reintroduzir variação útil a
tempo.

**Reprodutibilidade como pré-requisito do experimento, não um detalhe.**
`Math.random()` não aceita semente; sem semente, nenhuma execução seria
reproduzível e a tabela da seção 7 não poderia ser conferida por outra pessoa.
Por isso o projeto usa um PRNG próprio com semente (`mulberry32`, ~10 linhas),
injetado como parâmetro do núcleo — nunca lido de um global. Consequência
direta: **mesma semente + mesmos parâmetros = exatamente a mesma evolução**,
gene por gene, nos dois modos de execução (visual e lote), porque ambos
consomem o mesmo gerador na mesma ordem.

**Custo computacional não foi o gargalo.** Um lote de 30 execuções de até
1000 gerações roda em menos de 2 segundos em qualquer configuração testada
(tabela da seção 7) — a avaliação de aptidão em O(N) é barata. O único motivo
para o AG não escalar é estrutural (seleção pura sem reforço contra um espaço
de busca exponencial), não de desempenho da implementação.

## 9. Conclusão

O AG canônico foi implementado corretamente e se comporta exatamente como a
teoria prevê: resolve com alta confiabilidade instâncias pequenas do problema
(N=6, N=8), é sensível à taxa de mutação na direção esperada (mutação alta
prejudica a convergência), e degrada abruptamente em instâncias maiores por
falta de mecanismos de reforço contra convergência prematura e explosão
combinatória. O valor do experimento não está em resolver o problema — o
backtracking do próprio projeto faz isso de forma instantânea e determinística
— mas em produzir, com dados reproduzíveis, uma medição honesta de onde e por
que a técnica funciona e onde ela para de funcionar.

## 10. Como reproduzir

```bash
npm test                    # roda a suíte, inclui testes do núcleo do AG
```

Os números da seção 7 são reproduzíveis chamando `runBatch` diretamente
(`src/logic/ga/run.ts`) com os parâmetros indicados, ou pela interface: modo
"Genético" → ajustar N e `pm` no painel → botão "Lote de 30". A mesma semente
inicial sempre produz a mesma série de resultados.
