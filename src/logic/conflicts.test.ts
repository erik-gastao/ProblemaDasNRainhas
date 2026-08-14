import { describe, expect, it } from 'vitest';
import type { Queen } from '../types';
import {
  conflictBetween,
  conflictingIds,
  detectConflicts,
  isSolved,
} from './conflicts';
import { squareName } from './coords';

const q = (id: string, row: number, col: number): Queen => ({ id, row, col });

describe('conflictBetween', () => {
  it('detecta mesma linha', () => {
    expect(conflictBetween(q('a', 2, 0), q('b', 2, 5))).toBe('linha');
  });

  it('detecta mesma coluna', () => {
    expect(conflictBetween(q('a', 0, 3), q('b', 6, 3))).toBe('coluna');
  });

  it('detecta diagonal descendente', () => {
    expect(conflictBetween(q('a', 0, 0), q('b', 3, 3))).toBe('diagonal');
  });

  it('detecta diagonal ascendente', () => {
    expect(conflictBetween(q('a', 3, 0), q('b', 0, 3))).toBe('diagonal');
  });

  it('ignora casas fora de linha, coluna e diagonal', () => {
    expect(conflictBetween(q('a', 0, 0), q('b', 1, 2))).toBeNull();
  });

  it('atravessa rainhas no caminho: distancia nao importa', () => {
    expect(conflictBetween(q('a', 0, 0), q('b', 15, 15))).toBe('diagonal');
  });
});

describe('detectConflicts', () => {
  it('tabuleiro vazio nao tem conflito', () => {
    expect(detectConflicts([])).toEqual([]);
  });

  it('uma rainha sozinha nao tem conflito', () => {
    expect(detectConflicts([q('a', 0, 0)])).toEqual([]);
  });

  it('conta cada par uma unica vez', () => {
    // Tres rainhas na mesma linha => 3 pares.
    const pairs = detectConflicts([q('a', 0, 0), q('b', 0, 1), q('c', 0, 2)]);
    expect(pairs).toHaveLength(3);
    expect(pairs.every((p) => p.kind === 'linha')).toBe(true);
  });

  it('classifica linha antes de diagonal quando ambas valem', () => {
    // Mesma linha nunca e' tambem diagonal, mas garante a ordem de checagem.
    const [pair] = detectConflicts([q('a', 4, 1), q('b', 4, 2)]);
    expect(pair.kind).toBe('linha');
  });

  it('solucao classica de 4 rainhas nao tem conflito', () => {
    const solution = [q('a', 0, 1), q('b', 1, 3), q('c', 2, 0), q('d', 3, 2)];
    expect(detectConflicts(solution)).toEqual([]);
  });

  it('todas na primeira coluna geram todos os pares', () => {
    const queens = Array.from({ length: 4 }, (_, r) => q(String(r), r, 0));
    expect(detectConflicts(queens)).toHaveLength(6);
  });
});

describe('conflictingIds', () => {
  it('junta os ids dos dois lados de cada par', () => {
    const pairs = detectConflicts([q('a', 0, 0), q('b', 0, 1), q('c', 2, 5)]);
    expect(conflictingIds(pairs)).toEqual(new Set(['a', 'b']));
  });

  it('e vazio quando nao ha conflito', () => {
    expect(conflictingIds([]).size).toBe(0);
  });
});

describe('isSolved', () => {
  it('exige as n rainhas colocadas', () => {
    expect(isSolved([q('a', 0, 1), q('b', 1, 3)], 4)).toBe(false);
  });

  it('exige zero conflitos', () => {
    const queens = [q('a', 0, 0), q('b', 1, 1), q('c', 2, 2), q('d', 3, 3)];
    expect(isSolved(queens, 4)).toBe(false);
  });

  it('aceita solucao completa e limpa', () => {
    const solution = [q('a', 0, 1), q('b', 1, 3), q('c', 2, 0), q('d', 3, 2)];
    expect(isSolved(solution, 4)).toBe(true);
  });

  it('n = 1 com uma rainha ja esta resolvido', () => {
    expect(isSolved([q('a', 0, 0)], 1)).toBe(true);
  });
});

describe('squareName', () => {
  it('conta linhas de baixo para cima', () => {
    expect(squareName(0, 1, 4)).toBe('b4');
    expect(squareName(3, 0, 4)).toBe('a1');
  });

  it('cobre as 16 colunas', () => {
    expect(squareName(0, 15, 16)).toBe('p16');
  });
});
