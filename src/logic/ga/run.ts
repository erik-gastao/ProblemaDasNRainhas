import { evolve } from './evolve';
import { maxFitness } from './fitness';
import type { BatchSummary, GAParams, GenerationStats, RunRecord } from './types';

/**
 * Consome o gerador ate o fim e monta o registro da execucao.
 * E o consumidor do modo LOTE: laco sincrono, sem quadro de animacao.
 */
export function runGA(params: GAParams): RunRecord {
  const startedAt = Date.now();
  const history: GenerationStats[] = [];
  for (const stats of evolve(params)) history.push(stats);

  const last = history[history.length - 1];
  return {
    params,
    solved: last.solved,
    generations: last.generation,
    bestFitness: last.best,
    maxFitness: maxFitness(params.n),
    bestGenome: last.bestGenome,
    elapsedMs: Date.now() - startedAt,
    history,
  };
}

/**
 * Roda a mesma configuracao `runs` vezes variando APENAS a semente.
 *
 * Um AG rodado uma vez nao prova nada: ele e estocastico, e a mesma
 * configuracao pode resolver n=8 em 40 geracoes numa execucao e falhar em
 * 1000 na seguinte. Qualquer afirmacao sobre parametros precisa disto.
 *
 * Media e desvio saem apenas dos runs RESOLVIDOS — misturar os que bateram no
 * teto de geracoes inventaria um numero que nao significa nada. Ambos sao NaN
 * quando nenhum run resolve, e e por isso que successRate vem junto: ela e
 * que diz se a media tem sobre o que falar.
 */
export function runBatch(params: GAParams, runs: number): BatchSummary {
  const records: RunRecord[] = [];
  for (let i = 0; i < runs; i++) {
    records.push(runGA({ ...params, seed: params.seed + i }));
  }

  const solvedGenerations = records.filter((r) => r.solved).map((r) => r.generations);
  const solvedCount = solvedGenerations.length;

  let mean = NaN;
  let stdDev = NaN;
  if (solvedCount > 0) {
    mean = solvedGenerations.reduce((a, b) => a + b, 0) / solvedCount;
    const variance =
      solvedGenerations.reduce((acc, g) => acc + (g - mean) ** 2, 0) / solvedCount;
    stdDev = Math.sqrt(variance);
  }

  return {
    params,
    runs,
    solvedCount,
    successRate: runs === 0 ? 0 : solvedCount / runs,
    meanGenerations: mean,
    stdDevGenerations: stdDev,
    records,
  };
}
