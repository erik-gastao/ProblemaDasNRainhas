import { describe, expect, it } from 'vitest';
import { detectConflicts } from '../conflicts';
import { collisions, fitness, maxFitness } from './fitness';
import { genomeToQueens, randomGenome } from './genome';
import { mulberry32 } from './random';

describe('maxFitness', () => {
  it('e C(n,2)', () => {
    expect(maxFitness(1)).toBe(0);
    expect(maxFitness(2)).toBe(1);
    expect(maxFitness(4)).toBe(6);
    expect(maxFitness(8)).toBe(28);
    expect(maxFitness(16)).toBe(120);
  });
});

describe('collisions', () => {
  it('conta o exemplo da documentacao', () => {
    // 2 colisoes de coluna + 2 na diagonal desc + 1 na ascendente.
    expect(collisions([3, 1, 3, 2, 5, 5, 0, 4])).toBe(5);
    expect(fitness([3, 1, 3, 2, 5, 5, 0, 4])).toBe(23);
  });

  it('da zero na solucao perfeita', () => {
    expect(collisions([0, 4, 7, 5, 2, 6, 1, 3])).toBe(0);
    expect(fitness([0, 4, 7, 5, 2, 6, 1, 3])).toBe(28);
  });

  it('conta o pior caso: todas na mesma coluna', () => {
    // Mesma coluna colide aos pares; as diagonais ficam todas distintas.
    expect(collisions([0, 0, 0, 0])).toBe(maxFitness(4));
    expect(fitness([0, 0, 0, 0])).toBe(0);
  });

  it('conta a diagonal principal como um unico grupo', () => {
    expect(collisions([0, 1, 2, 3])).toBe(maxFitness(4));
  });

  it('nao conta o mesmo par duas vezes', () => {
    // Duas rainhas em (0,0) e (1,1): mesma diagonal, colunas diferentes.
    expect(collisions([0, 1])).toBe(1);
  });

  it('trata n=1, onde nao existe par nenhum', () => {
    expect(collisions([0])).toBe(0);
    expect(fitness([0])).toBe(0);
  });

  it('nao tem solucao para n=2 nem n=3', () => {
    for (const genome of [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]) {
      expect(collisions(genome)).toBeGreaterThan(0);
    }

    let bestOf3 = 0;
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        for (let c = 0; c < 3; c++) {
          bestOf3 = Math.max(bestOf3, fitness([a, b, c]));
        }
      }
    }
    expect(bestOf3).toBeLessThan(maxFitness(3));
  });
});

describe('invariante contra detectConflicts', () => {
  // A implementacao O(n) nova e validada contra a O(n^2) lenta e ja testada.
  it('bate com detectConflicts em genomas aleatorios', () => {
    const rand = mulberry32(20260903);
    for (let n = 1; n <= 16; n++) {
      for (let trial = 0; trial < 60; trial++) {
        const genome = randomGenome(n, rand);
        expect(collisions(genome)).toBe(detectConflicts(genomeToQueens(genome)).length);
      }
    }
  });

  it('nunca produz conflito de linha, por construcao da representacao', () => {
    const rand = mulberry32(7);
    for (let trial = 0; trial < 200; trial++) {
      const kinds = detectConflicts(genomeToQueens(randomGenome(8, rand))).map((p) => p.kind);
      expect(kinds).not.toContain('linha');
    }
  });
});
