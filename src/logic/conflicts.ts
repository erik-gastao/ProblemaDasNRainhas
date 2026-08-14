import type { ConflictKind, ConflictPair, Queen } from '../types';

/**
 * Como duas rainhas se atacam, ou null se nao se atacam.
 * Uma rainha ataca em linha, coluna e diagonal, sem limite de distancia.
 */
export function conflictBetween(a: Queen, b: Queen): ConflictKind | null {
  if (a.row === b.row) return 'linha';
  if (a.col === b.col) return 'coluna';
  if (Math.abs(a.row - b.row) === Math.abs(a.col - b.col)) return 'diagonal';
  return null;
}

/** Todos os pares de rainhas que se atacam. */
export function detectConflicts(queens: Queen[]): ConflictPair[] {
  const pairs: ConflictPair[] = [];
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const kind = conflictBetween(queens[i], queens[j]);
      if (kind) pairs.push({ a: queens[i], b: queens[j], kind });
    }
  }
  return pairs;
}

/** Ids das rainhas envolvidas em pelo menos um conflito. */
export function conflictingIds(pairs: ConflictPair[]): Set<string> {
  const ids = new Set<string>();
  for (const { a, b } of pairs) {
    ids.add(a.id);
    ids.add(b.id);
  }
  return ids;
}

/** Configuracao valida: as n rainhas colocadas, nenhuma se atacando. */
export function isSolved(queens: Queen[], n: number): boolean {
  return queens.length === n && detectConflicts(queens).length === 0;
}
