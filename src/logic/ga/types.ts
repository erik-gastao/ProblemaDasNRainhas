/**
 * Tipos do algoritmo genetico canonico.
 * Ver SolutionPurpose.md para a justificativa de cada escolha.
 */

/** Cromossomo: genome[linha] = coluna. Valores podem repetir. */
export type Genome = number[];

/** Fonte de aleatoriedade. Sempre injetada, nunca global. */
export type Random = () => number;

export interface GAParams {
  /** Tamanho do tabuleiro. */
  n: number;
  /** Quantos individuos vivos ao mesmo tempo. */
  populationSize: number;
  /** pc: probabilidade de cruzar um par de pais. */
  crossoverRate: number;
  /** pm: probabilidade de mutacao POR GENE. */
  mutationRate: number;
  /** Limite de geracoes de reproducao. */
  maxGenerations: number;
  /** Semente do PRNG. Mesma semente = mesma evolucao. */
  seed: number;
}

/** Uma linha da serie temporal emitida a cada geracao. */
export interface GenerationStats {
  /** 0 = populacao inicial aleatoria, ja avaliada. */
  generation: number;
  best: number;
  average: number;
  worst: number;
  /** Entropia media por locus, normalizada em [0, 1]. */
  diversity: number;
  /** Copia do melhor genoma DESTA geracao. Nao ha hall of fame. */
  bestGenome: Genome;
  solved: boolean;
}

/** Resultado completo de uma execucao, pronto para persistir. */
export interface RunRecord {
  params: GAParams;
  solved: boolean;
  /** Indice da ultima geracao avaliada. */
  generations: number;
  bestFitness: number;
  maxFitness: number;
  bestGenome: Genome;
  elapsedMs: number;
  history: GenerationStats[];
}

/** Consolidado de M execucoes que variam apenas a semente. */
export interface BatchSummary {
  /** Parametros comuns; o seed aqui e o da primeira execucao. */
  params: GAParams;
  runs: number;
  solvedCount: number;
  /** solvedCount / runs, em [0, 1]. */
  successRate: number;
  /** Media de geracoes ate a solucao, so entre os runs resolvidos. NaN se nenhum. */
  meanGenerations: number;
  /** Desvio padrao populacional das geracoes ate a solucao. NaN se nenhum. */
  stdDevGenerations: number;
  records: RunRecord[];
}

export const DEFAULT_POPULATION_SIZE = 100;
export const DEFAULT_CROSSOVER_RATE = 0.8;
export const DEFAULT_MUTATION_RATE = 0.02;
export const DEFAULT_MAX_GENERATIONS = 1000;
/** Faixa em que a bancada tem sinal util. Ver SolutionPurpose.md secao 9. */
export const DEFAULT_BATCH_N = 8;
export const DEFAULT_BATCH_RUNS = 30;
