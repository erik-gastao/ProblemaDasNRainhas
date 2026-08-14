import type { Queen } from '../types';

/**
 * Adapta as rainhas a um tabuleiro de outro tamanho.
 * Sai quem ficou fora do grid; se ainda sobrar mais que n,
 * as mais antigas ficam e o excedente cai.
 */
export function fitQueens(queens: Queen[], n: number): Queen[] {
  return queens.filter((q) => q.row < n && q.col < n).slice(0, n);
}
