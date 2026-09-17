import type { Queen } from '../types';

/**
 * Verifica se as rainhas dadas podem ser completadas ate n rainhas sem
 * nenhum conflito. Assume que 'queens' ja esta livre de conflitos entre si;
 * caso contrario nao existe solucao possivel e a busca sempre falha.
 *
 * Backtracking classico linha a linha: linhas ja ocupadas ficam fixas,
 * as demais tentam cada coluna livre.
 */
export function canComplete(queens: Queen[], n: number): boolean {
  const fixedCol = new Map<number, number>();
  for (const q of queens) fixedCol.set(q.row, q.col);

  const usedCols = new Set(queens.map((q) => q.col));
  const cols: number[] = [];

  function fits(row: number, col: number): boolean {
    for (let r = 0; r < row; r++) {
      const c = cols[r];
      if (c === col || Math.abs(c - col) === Math.abs(r - row)) return false;
    }
    return true;
  }

  function backtrack(row: number): boolean {
    if (row === n) return true;

    const forced = fixedCol.get(row);
    if (forced !== undefined) {
      if (!fits(row, forced)) return false;
      cols[row] = forced;
      return backtrack(row + 1);
    }

    for (let col = 0; col < n; col++) {
      if (usedCols.has(col) || !fits(row, col)) continue;
      cols[row] = col;
      usedCols.add(col);
      if (backtrack(row + 1)) return true;
      usedCols.delete(col);
    }
    return false;
  }

  return backtrack(0);
}
