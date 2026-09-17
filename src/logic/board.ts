import { conflictBetween } from './conflicts';
import type { Queen, Square } from '../types';

/**
 * Adapta as rainhas a um tabuleiro de outro tamanho.
 * Sai quem ficou fora do grid; se ainda sobrar mais que n,
 * as mais antigas ficam e o excedente cai.
 */
export function fitQueens(queens: Queen[], n: number): Queen[] {
  return queens.filter((q) => q.row < n && q.col < n).slice(0, n);
}

/** Casas livres de um tabuleiro n x n. */
export function emptySquares(queens: Queen[], n: number): Square[] {
  const occupied = new Set(queens.map((q) => `${q.row},${q.col}`));
  const squares: Square[] = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!occupied.has(`${row},${col}`)) squares.push({ row, col });
    }
  }
  return squares;
}

/** Casas livres que nenhuma rainha atual ataca. */
export function safeSquares(queens: Queen[], n: number): Square[] {
  return emptySquares(queens, n).filter((square) =>
    queens.every((q) => conflictBetween(q, { id: '', ...square }) === null),
  );
}
