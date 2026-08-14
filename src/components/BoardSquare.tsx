import type { KeyboardEvent } from 'react';
import { squareName } from '../logic/coords';
import type { Queen } from '../types';
import { QueenPiece } from './QueenPiece';

interface Props {
  row: number;
  col: number;
  n: number;
  queen: Queen | undefined;
  conflicted: boolean;
  selected: boolean;
  dragging: boolean;
  dropTarget: boolean;
  focusable: boolean;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function BoardSquare({
  row,
  col,
  n,
  queen,
  conflicted,
  selected,
  dragging,
  dropTarget,
  focusable,
  onKeyDown,
}: Props) {
  const dark = (row + col) % 2 === 1;
  const name = squareName(row, col, n);

  const classes = ['square', dark ? 'square--dark' : 'square--light'];
  if (dropTarget) classes.push('square--target');

  const label = queen
    ? `${name}, rainha${conflicted ? ' em conflito' : ''}`
    : `${name}, vazia`;

  return (
    <div
      id={`sq-${row}-${col}`}
      className={classes.join(' ')}
      role="gridcell"
      tabIndex={focusable ? 0 : -1}
      aria-label={label}
      aria-selected={selected}
      data-row={row}
      data-col={col}
      onKeyDown={onKeyDown}
    >
      {queen && (
        <QueenPiece
          conflicted={conflicted}
          dragging={dragging}
          selected={selected}
        />
      )}
    </div>
  );
}
