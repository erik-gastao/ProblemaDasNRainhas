import { describe, expect, it } from 'vitest';
import type { Queen } from '../types';
import { canComplete } from './solver';

const q = (id: string, row: number, col: number): Queen => ({ id, row, col });

// As duas unicas solucoes de 4 rainhas (linha -> coluna, 0-indexado):
// [1, 3, 0, 2] e sua espelhada [2, 0, 3, 1].

describe('canComplete', () => {
  it('tabuleiro vazio completa quando o tamanho tem solucao (n = 8)', () => {
    expect(canComplete([], 8)).toBe(true);
  });

  it('n = 2 e n = 3 nunca completam, mesmo vazios', () => {
    expect(canComplete([], 2)).toBe(false);
    expect(canComplete([], 3)).toBe(false);
  });

  it('completa quando a rainha fixa esta numa das solucoes', () => {
    expect(canComplete([q('a', 0, 1)], 4)).toBe(true);
    expect(canComplete([q('a', 0, 2)], 4)).toBe(true);
  });

  it('nao completa quando a rainha fixa nao esta em nenhuma solucao', () => {
    expect(canComplete([q('a', 0, 0)], 4)).toBe(false);
  });

  it('detecta beco sem saida: par sem conflito imediato mas sem solucao em comum', () => {
    // row0=1 so' completa com row2=0 (solucao [1,3,0,2]); row2=2 fecha a porta.
    expect(canComplete([q('a', 0, 1), q('b', 2, 2)], 4)).toBe(false);
  });

  it('reconhece configuracao ja completa e valida', () => {
    const solution = [q('a', 0, 1), q('b', 1, 3), q('c', 2, 0), q('d', 3, 2)];
    expect(canComplete(solution, 4)).toBe(true);
  });

  it('configuracao completa mas com conflito nao e uma solucao', () => {
    const withConflict = [q('a', 0, 0), q('b', 1, 0), q('c', 2, 2), q('d', 3, 3)];
    expect(canComplete(withConflict, 4)).toBe(false);
  });
});
