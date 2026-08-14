import { describe, expect, it } from 'vitest';
import type { Queen } from '../types';
import { fitQueens } from './board';

const q = (id: string, row: number, col: number): Queen => ({ id, row, col });

describe('fitQueens', () => {
  it('mantem tudo quando o tabuleiro cresce', () => {
    const queens = [q('a', 0, 0), q('b', 3, 3)];
    expect(fitQueens(queens, 8)).toEqual(queens);
  });

  it('remove quem ficou fora do grid menor', () => {
    const queens = [q('a', 0, 0), q('b', 6, 1), q('c', 1, 7)];
    expect(fitQueens(queens, 4)).toEqual([q('a', 0, 0)]);
  });

  it('corta o excedente quando sobram mais rainhas que n', () => {
    const queens = [q('a', 0, 0), q('b', 1, 1), q('c', 2, 2)];
    expect(fitQueens(queens, 2)).toEqual([q('a', 0, 0), q('b', 1, 1)]);
  });

  it('a casa de indice n-1 continua valida', () => {
    expect(fitQueens([q('a', 3, 3)], 4)).toHaveLength(1);
    expect(fitQueens([q('a', 4, 4)], 4)).toHaveLength(0);
  });

  it('tabuleiro vazio continua vazio', () => {
    expect(fitQueens([], 8)).toEqual([]);
  });

  it('n = 1 aceita no maximo a rainha em a1', () => {
    expect(fitQueens([q('a', 0, 0), q('b', 0, 1)], 1)).toEqual([q('a', 0, 0)]);
  });
});
