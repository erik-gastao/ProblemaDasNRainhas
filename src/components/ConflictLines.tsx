import type { ConflictPair } from '../types';

interface Props {
  conflicts: ConflictPair[];
  n: number;
}

/**
 * Uma linha por par de rainhas que se atacam.
 * O viewBox e' n x n, entao cada unidade e' uma casa e o centro
 * da casa (row, col) fica em (col + 0.5, row + 0.5).
 */
export function ConflictLines({ conflicts, n }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <svg
      className="conflict-lines"
      viewBox={`0 0 ${n} ${n}`}
      aria-hidden="true"
    >
      {conflicts.map(({ a, b }) => (
        <line
          key={`${a.id}-${b.id}`}
          x1={a.col + 0.5}
          y1={a.row + 0.5}
          x2={b.col + 0.5}
          y2={b.row + 0.5}
          strokeWidth={0.05}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
