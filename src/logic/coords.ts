import { MAX_N } from '../types';

/** Uma letra por coluna. MAX_N = 16 cabe exatamente em a..p. */
const FILES = 'abcdefghijklmnop';

export function fileLabel(col: number): string {
  return FILES[col] ?? String(col + 1);
}

/** Linhas contam de baixo para cima, como no xadrez: row 0 (topo) = n. */
export function rankLabel(row: number, n: number): number {
  return n - row;
}

/** Nome da casa no estilo xadrez, ex: (0, 1) com n=4 => "b4". */
export function squareName(row: number, col: number, n: number): string {
  return `${fileLabel(col)}${rankLabel(row, n)}`;
}

export function filesFor(n: number): string[] {
  return Array.from({ length: Math.min(n, MAX_N) }, (_, c) => fileLabel(c));
}
