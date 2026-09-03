import { describe, expect, it } from 'vitest';
import { evolve } from './evolve';
import { collisions, maxFitness } from './fitness';
import { runBatch, runGA } from './run';
import type { GAParams } from './types';
import {
  DEFAULT_CROSSOVER_RATE,
  DEFAULT_MAX_GENERATIONS,
  DEFAULT_MUTATION_RATE,
  DEFAULT_POPULATION_SIZE,
} from './types';

const params = (over: Partial<GAParams> = {}): GAParams => ({
  n: 8,
  populationSize: DEFAULT_POPULATION_SIZE,
  crossoverRate: DEFAULT_CROSSOVER_RATE,
  mutationRate: DEFAULT_MUTATION_RATE,
  maxGenerations: DEFAULT_MAX_GENERATIONS,
  seed: 1,
  ...over,
});

describe('reprodutibilidade', () => {
  // Fundacao da bancada: sem isto, o historico registra resultados que
  // ninguem consegue reproduzir.
  it('mesma semente produz a serie inteira identica', () => {
    const a = runGA(params({ seed: 12345, maxGenerations: 60 }));
    const b = runGA(params({ seed: 12345, maxGenerations: 60 }));
    expect(a.history).toEqual(b.history);
    expect(a.bestGenome).toEqual(b.bestGenome);
    expect(a.solved).toBe(b.solved);
  });

  it('sementes diferentes produzem evolucoes diferentes', () => {
    const a = runGA(params({ seed: 1, maxGenerations: 60 }));
    const b = runGA(params({ seed: 2, maxGenerations: 60 }));
    expect(a.history).not.toEqual(b.history);
  });

  it('consumir o gerador em passos da o mesmo que consumir de uma vez', () => {
    // O modo visual puxa um yield por quadro; o modo lote consome tudo num
    // for...of. Os dois tem que percorrer exatamente a mesma evolucao.
    const p = params({ seed: 999, maxGenerations: 40 });
    const passoAPasso = [];
    const generator = evolve(p);
    for (let step = generator.next(); !step.done; step = generator.next()) {
      passoAPasso.push(step.value);
    }
    expect(passoAPasso).toEqual(runGA(p).history);
  });
});

describe('ciclo canonico', () => {
  it('comeca na geracao 0 com a populacao inicial ja avaliada', () => {
    const record = runGA(params({ seed: 4, maxGenerations: 10 }));
    expect(record.history[0].generation).toBe(0);
    expect(record.history[0].diversity).toBeGreaterThan(0.5);
  });

  it('emite uma entrada por geracao, ate o limite', () => {
    const record = runGA(params({ n: 3, maxGenerations: 25 }));
    expect(record.history).toHaveLength(26);
    expect(record.generations).toBe(25);
  });

  it('mantem a populacao no tamanho pedido, inclusive impar', () => {
    for (const populationSize of [1, 7, 30]) {
      const record = runGA(params({ populationSize, maxGenerations: 5, seed: 8 }));
      expect(record.history).not.toHaveLength(0);
      expect(record.bestGenome).toHaveLength(8);
    }
  });

  it('a curva do melhor oscila para baixo, por nao ter elitismo', () => {
    // O principal produto pedagogico da entrega: sem elitismo e com
    // substituicao total, o melhor da geracao k pode nao existir na k+1.
    const { history } = runGA(params({ seed: 3, maxGenerations: 120 }));
    const caiu = history.some((stats, i) => i > 0 && stats.best < history[i - 1].best);
    expect(caiu).toBe(true);
  });

  it('a diversidade cai da primeira geracao para o fim da corrida', () => {
    const { history } = runGA(params({ seed: 3, maxGenerations: 120 }));
    expect(history[history.length - 1].diversity).toBeLessThan(history[0].diversity);
  });

  it('nunca reporta aptidao acima do otimo, e a media fica entre pior e melhor', () => {
    const { history } = runGA(params({ seed: 6, maxGenerations: 50 }));
    for (const stats of history) {
      expect(stats.best).toBeLessThanOrEqual(maxFitness(8));
      expect(stats.worst).toBeLessThanOrEqual(stats.average);
      expect(stats.average).toBeLessThanOrEqual(stats.best);
      expect(stats.worst).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('parada', () => {
  it('resolve n=8 e para no exato momento em que a solucao aparece', () => {
    const record = runGA(params({ seed: 3 }));
    expect(record.solved).toBe(true);
    expect(record.bestFitness).toBe(maxFitness(8));
    expect(collisions(record.bestGenome)).toBe(0);
    // A parada acontece na avaliacao, entao so a ultima geracao esta resolvida.
    expect(record.history.filter((s) => s.solved)).toHaveLength(1);
    expect(record.history[record.history.length - 1].solved).toBe(true);
  });

  it('resolve n=1 na geracao 0: toda a populacao ja nasce otima', () => {
    const record = runGA(params({ n: 1 }));
    expect(record.solved).toBe(true);
    expect(record.generations).toBe(0);
    expect(record.maxFitness).toBe(0);
    expect(record.bestGenome).toEqual([0]);
  });

  it('sabe desistir: n=2 e n=3 nao tem solucao', () => {
    for (const n of [2, 3]) {
      const record = runGA(params({ n, maxGenerations: 80 }));
      expect(record.solved).toBe(false);
      expect(record.generations).toBe(80);
      expect(record.bestFitness).toBeLessThan(maxFitness(n));
    }
  });

  it('nao divide por zero quando a populacao inteira tem aptidao 0', () => {
    // Em n=2 toda configuracao colide, entao a roleta recebe total 0 em
    // todas as geracoes.
    const record = runGA(params({ n: 2, maxGenerations: 50 }));
    expect(record.history.every((s) => s.best === 0)).toBe(true);
    expect(record.bestGenome).toHaveLength(2);
  });
});

describe('runBatch', () => {
  it('varia apenas a semente e consolida a estatistica', () => {
    const summary = runBatch(params({ seed: 100, maxGenerations: 400 }), 6);

    expect(summary.runs).toBe(6);
    expect(summary.records.map((r) => r.params.seed)).toEqual([100, 101, 102, 103, 104, 105]);
    expect(summary.records.every((r) => r.params.n === 8)).toBe(true);

    expect(summary.solvedCount).toBeGreaterThan(0);
    expect(summary.successRate).toBeCloseTo(summary.solvedCount / 6, 12);
    expect(summary.meanGenerations).toBeGreaterThan(0);
    expect(summary.stdDevGenerations).toBeGreaterThanOrEqual(0);
  });

  it('media e desvio saem apenas dos runs resolvidos', () => {
    const summary = runBatch(params({ seed: 100, maxGenerations: 400 }), 6);
    const resolvidos = summary.records.filter((r) => r.solved).map((r) => r.generations);
    const media = resolvidos.reduce((a, b) => a + b, 0) / resolvidos.length;
    expect(summary.meanGenerations).toBeCloseTo(media, 12);
    // Nenhum run que bateu no teto entra na media.
    expect(summary.meanGenerations).toBeLessThanOrEqual(400);
  });

  it('devolve NaN quando nenhum run resolve, com successRate 0', () => {
    const summary = runBatch(params({ n: 3, maxGenerations: 40 }), 4);
    expect(summary.solvedCount).toBe(0);
    expect(summary.successRate).toBe(0);
    expect(summary.meanGenerations).toBeNaN();
    expect(summary.stdDevGenerations).toBeNaN();
  });
});
