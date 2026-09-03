import { diversity } from './diversity';
import { fitness, maxFitness } from './fitness';
import { randomGenome } from './genome';
import { mutate, onePointCrossover, rouletteSelect } from './operators';
import { mulberry32 } from './random';
import type { GAParams, GenerationStats, Genome } from './types';

/**
 * O ciclo canonico, como funcao geradora pura.
 *
 * Emite as estatisticas de cada geracao e para quando a solucao aparece ou
 * quando o limite de geracoes e alcancado.
 *
 * Ser um gerador e o que permite os dois modos de execucao consumirem
 * exatamente o mesmo algoritmo: o modo visual puxa um yield por quadro de
 * animacao, o modo lote consome tudo num for...of. Como percorrem o mesmo
 * gerador, consomem o PRNG na mesma ordem, e a mesma semente produz a mesma
 * evolucao nos dois.
 *
 * Por isso o quadro de animacao NAO pode entrar aqui, e o PRNG nunca pode
 * vir da camada React.
 *
 * A geracao 0 e a populacao inicial aleatoria, ja avaliada; maxGenerations
 * conta os passos de reproducao, logo a serie tem no maximo
 * maxGenerations + 1 entradas.
 */
export function* evolve(params: GAParams): Generator<GenerationStats> {
  const { n, populationSize, crossoverRate, mutationRate, maxGenerations, seed } = params;
  const rand = mulberry32(seed);
  const optimum = maxFitness(n);

  let population: Genome[] = Array.from({ length: populationSize }, () =>
    randomGenome(n, rand),
  );

  for (let generation = 0; ; generation++) {
    const fitnesses = population.map(fitness);

    let sum = 0;
    let best = -Infinity;
    let worst = Infinity;
    let bestIndex = 0;
    for (let i = 0; i < fitnesses.length; i++) {
      const f = fitnesses[i];
      sum += f;
      if (f > best) {
        best = f;
        bestIndex = i;
      }
      if (f < worst) worst = f;
    }

    // A verificacao acontece AQUI, antes de qualquer reproducao: uma solucao
    // que nasce nesta geracao e registrada nesta geracao. Nao ha hall of
    // fame, mas tambem nao ha solucao perdida em silencio.
    const solved = best === optimum;

    yield {
      generation,
      best,
      average: sum / fitnesses.length,
      worst,
      diversity: diversity(population, n),
      bestGenome: population[bestIndex].slice(),
      solved,
    };

    if (solved || generation >= maxGenerations) return;

    // Substituicao geracional total: os filhos viram a nova populacao inteira
    // e a geracao anterior deixa de existir. Ninguem sobrevive por merito.
    const children: Genome[] = [];
    while (children.length < populationSize) {
      const parentA = rouletteSelect(population, fitnesses, sum, rand);
      const parentB = rouletteSelect(population, fitnesses, sum, rand);

      const [childA, childB] =
        rand() < crossoverRate
          ? onePointCrossover(parentA, parentB, rand)
          : [parentA.slice(), parentB.slice()];

      mutate(childA, n, mutationRate, rand);
      mutate(childB, n, mutationRate, rand);

      children.push(childA);
      // Populacao impar descarta o segundo filho do ultimo par.
      if (children.length < populationSize) children.push(childB);
    }

    population = children;
  }
}
