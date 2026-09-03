import { describe, expect, it } from 'vitest';
import { diversity } from './diversity';
import { genomeToQueens, queensToGenome, randomGenome } from './genome';
import { mutate, onePointCrossover, rouletteSelect } from './operators';
import { mulberry32, randomInt } from './random';
import type { Genome } from './types';

describe('mulberry32', () => {
  it('repete a sequencia inteira para a mesma semente', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 500 }, a);
    expect(seqA).toEqual(Array.from({ length: 500 }, b));
  });

  it('diverge entre sementes diferentes', () => {
    const a = Array.from({ length: 50 }, mulberry32(1));
    const b = Array.from({ length: 50 }, mulberry32(2));
    expect(a).not.toEqual(b);
  });

  it('fica em [0, 1)', () => {
    const rand = mulberry32(99);
    for (let i = 0; i < 5000; i++) {
      const x = rand();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('randomInt cobre a faixa e nunca sai dela', () => {
    const rand = mulberry32(5);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = randomInt(rand, 8);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(8);
      seen.add(v);
    }
    expect(seen.size).toBe(8);
  });
});

describe('randomGenome', () => {
  it('tem n genes, todos em [0, n)', () => {
    const rand = mulberry32(3);
    const genome = randomGenome(12, rand);
    expect(genome).toHaveLength(12);
    for (const gene of genome) {
      expect(gene).toBeGreaterThanOrEqual(0);
      expect(gene).toBeLessThan(12);
    }
  });
});

describe('genomeToQueens / queensToGenome', () => {
  it('faz a ida e a volta sem perder nada', () => {
    const genome = [3, 1, 3, 2, 5, 5, 0, 4];
    expect(queensToGenome(genomeToQueens(genome), 8)).toEqual(genome);
  });

  it('poe uma rainha por linha, com id estavel', () => {
    const queens = genomeToQueens([2, 0, 1]);
    expect(queens).toEqual([
      { id: 'q1', row: 0, col: 2 },
      { id: 'q2', row: 1, col: 0 },
      { id: 'q3', row: 2, col: 1 },
    ]);
  });

  it('recusa configuracao que esta representacao nao expressa', () => {
    // Duas rainhas na mesma linha: exatamente o estado que o tabuleiro manual
    // aceita e que o vetor livre nao consegue codificar.
    const duasNaLinha = [
      { id: 'a', row: 0, col: 0 },
      { id: 'b', row: 0, col: 2 },
      { id: 'c', row: 2, col: 1 },
    ];
    expect(queensToGenome(duasNaLinha, 3)).toBeNull();
    expect(queensToGenome([{ id: 'a', row: 0, col: 0 }], 3)).toBeNull();
  });
});

describe('diversity', () => {
  it('e 0 quando a populacao inteira e a mesma copia', () => {
    const clones: Genome[] = Array.from({ length: 20 }, () => [1, 2, 3, 0]);
    expect(diversity(clones, 4)).toBe(0);
  });

  it('e 1 quando cada locus cobre todas as colunas por igual', () => {
    // Populacao de 4 individuos cobrindo as 4 colunas em cada locus.
    const uniform: Genome[] = [
      [0, 1, 2, 3],
      [1, 2, 3, 0],
      [2, 3, 0, 1],
      [3, 0, 1, 2],
    ];
    expect(diversity(uniform, 4)).toBeCloseTo(1, 12);
  });

  it('cai quando a populacao perde variedade', () => {
    const rand = mulberry32(11);
    const aleatoria = Array.from({ length: 100 }, () => randomGenome(8, rand));
    const quaseIgual: Genome[] = Array.from({ length: 100 }, () => [0, 1, 2, 3, 4, 5, 6, 7]);
    quaseIgual[0] = [7, 1, 2, 3, 4, 5, 6, 0];
    expect(diversity(aleatoria, 8)).toBeGreaterThan(diversity(quaseIgual, 8));
  });

  it('e 0 para n=1, onde nao ha variedade possivel', () => {
    expect(diversity([[0], [0]], 1)).toBe(0);
  });
});

describe('rouletteSelect', () => {
  it('favorece o mais apto sem eliminar o pior', () => {
    const population: Genome[] = [[0], [1], [2]];
    const fitnesses = [1, 2, 27];
    const rand = mulberry32(17);
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i++) {
      counts[population.indexOf(rouletteSelect(population, fitnesses, 30, rand))]++;
    }
    expect(counts[2]).toBeGreaterThan(counts[1]);
    expect(counts[1]).toBeGreaterThan(counts[0]);
    // O pior sobrevive na roleta: nao e eliminacao.
    expect(counts[0]).toBeGreaterThan(0);
  });

  it('cai em sorteio uniforme quando a aptidao total e zero', () => {
    const population: Genome[] = [[0], [1], [2], [3]];
    const rand = mulberry32(23);
    const seen = new Set<Genome>();
    for (let i = 0; i < 400; i++) {
      const picked = rouletteSelect(population, [0, 0, 0, 0], 0, rand);
      expect(picked).toBeDefined();
      seen.add(picked);
    }
    expect(seen.size).toBe(4);
  });
});

describe('onePointCrossover', () => {
  it('corta em [1, n-1], entao os dois pais sempre contribuem', () => {
    const a = [0, 0, 0, 0, 0, 0, 0, 0];
    const b = [1, 1, 1, 1, 1, 1, 1, 1];
    const rand = mulberry32(31);
    for (let i = 0; i < 500; i++) {
      const [c1, c2] = onePointCrossover(a, b, rand);
      expect(c1).toHaveLength(8);
      expect(c2).toHaveLength(8);
      expect(c1).toContain(0);
      expect(c1).toContain(1);
      expect(c2).toContain(0);
      expect(c2).toContain(1);
      // Os filhos sao complementares: cada gene veio de um pai diferente.
      expect(c1.map((g, k) => g + c2[k])).toEqual(new Array<number>(8).fill(1));
    }
  });

  it('nao altera os pais', () => {
    const a = [1, 2, 3, 4];
    const b = [5, 6, 7, 8];
    onePointCrossover(a, b, mulberry32(1));
    expect(a).toEqual([1, 2, 3, 4]);
    expect(b).toEqual([5, 6, 7, 8]);
  });

  it('devolve copias quando n < 2, onde nao existe ponto de corte', () => {
    const [c1, c2] = onePointCrossover([0], [0], mulberry32(1));
    expect(c1).toEqual([0]);
    expect(c2).toEqual([0]);
  });
});

describe('mutate', () => {
  it('nao muda nada com taxa 0', () => {
    const genome = [3, 1, 3, 2];
    mutate(genome, 4, 0, mulberry32(1));
    expect(genome).toEqual([3, 1, 3, 2]);
  });

  it('mantem todo alelo dentro de [0, n) com taxa 1', () => {
    const genome = [0, 0, 0, 0, 0, 0, 0, 0];
    const rand = mulberry32(13);
    for (let round = 0; round < 200; round++) {
      mutate(genome, 8, 1, rand);
      for (const gene of genome) {
        expect(gene).toBeGreaterThanOrEqual(0);
        expect(gene).toBeLessThan(8);
      }
    }
  });

  it('altera parte dos genes com taxa intermediaria', () => {
    const original = [0, 1, 2, 3, 4, 5, 6, 7];
    const genome = [...original];
    mutate(genome, 8, 0.5, mulberry32(77));
    expect(genome).not.toEqual(original);
    expect(genome).toHaveLength(8);
  });
});
