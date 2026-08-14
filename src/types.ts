export const MIN_N = 1;
export const MAX_N = 16;
export const DEFAULT_N = 8;

/** Rainha no tabuleiro. row 0 = topo, col 0 = esquerda. */
export interface Queen {
  id: string;
  row: number;
  col: number;
}

export interface Square {
  row: number;
  col: number;
}

export type ConflictKind = 'linha' | 'coluna' | 'diagonal';

export interface ConflictPair {
  a: Queen;
  b: Queen;
  kind: ConflictKind;
}
