import { randomInt } from './random';
import type { Genome, Random } from './types';

/**
 * Selecao por roleta (fitness-proportionate).
 *
 * Cada individuo ocupa uma fatia proporcional a sua aptidao. Nao e
 * eliminacao: o pior individuo ainda tem chance nao nula de gerar filhos, e e
 * isso que preserva diversidade.
 *
 * Aptidao total zero (possivel em n=2, onde toda configuracao colide) cairia
 * em divisao por zero; nesse caso a roleta vira sorteio uniforme.
 */
export function rouletteSelect(
  population: Genome[],
  fitnesses: number[],
  totalFitness: number,
  rand: Random,
): Genome {
  if (totalFitness <= 0) return population[randomInt(rand, population.length)];

  let ticket = rand() * totalFitness;
  for (let i = 0; i < population.length; i++) {
    ticket -= fitnesses[i];
    if (ticket <= 0) return population[i];
  }
  // So alcancavel por erro de ponto flutuante acumulado.
  return population[population.length - 1];
}

/**
 * Crossover de 1 ponto.
 *
 * O corte sai de [1, n-1] para que os dois pais sempre contribuam com pelo
 * menos um gene — corte em 0 ou n devolveria copias fieis, o que ja e o que
 * acontece quando o sorteio passa de pc.
 */
export function onePointCrossover(a: Genome, b: Genome, rand: Random): [Genome, Genome] {
  const n = a.length;
  if (n < 2) return [a.slice(), b.slice()];

  const cut = 1 + randomInt(rand, n - 1);
  return [
    [...a.slice(0, cut), ...b.slice(cut)],
    [...b.slice(0, cut), ...a.slice(cut)],
  ];
}

/**
 * Mutacao com probabilidade pm POR GENE, no lugar.
 *
 * Unica fonte de material genetico novo depois da populacao inicial: o
 * crossover so recombina o que ja existe.
 *
 * Muta sempre o array recebido, que e sempre um filho recem-criado — nunca um
 * individuo ainda vivo na populacao corrente.
 */
export function mutate(genome: Genome, n: number, rate: number, rand: Random): void {
  for (let i = 0; i < genome.length; i++) {
    if (rand() < rate) genome[i] = randomInt(rand, n);
  }
}
