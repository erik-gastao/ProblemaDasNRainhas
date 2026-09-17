import { describe, expect, it } from 'vitest';
import type { Queen } from '../types';
import { correctSquares, fitQueens, safeSquares } from './board';

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

// n=4 so' tem duas solucoes: [1,3,0,2] e [2,0,3,1] (linha -> coluna).
describe('correctSquares', () => {
  it("do vazio, so' aceita as 8 casas que aparecem em alguma solucao de 4", () => {
    const squares = correctSquares([], 4);
    expect(squares).toHaveLength(8);
    expect(squares).toContainEqual({ row: 0, col: 1 });
    expect(squares).toContainEqual({ row: 0, col: 2 });
    expect(squares).not.toContainEqual({ row: 0, col: 0 });
  });

  it('descarta casa segura que leva a beco sem saida', () => {
    const queens = [q('a', 0, 1)];
    // (2,2) nao ataca (0,1), mas nenhuma solucao de 4 rainhas tem essa dupla.
    expect(safeSquares(queens, 4)).toContainEqual({ row: 2, col: 2 });
    expect(correctSquares(queens, 4)).not.toContainEqual({ row: 2, col: 2 });
    // (2,0) fecha a solucao [1,3,0,2] junto com a linha 1 = col 3.
    expect(correctSquares(queens, 4)).toContainEqual({ row: 2, col: 0 });
  });
});
