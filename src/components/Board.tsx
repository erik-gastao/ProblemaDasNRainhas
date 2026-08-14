import type { KeyboardEvent, PointerEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import type { Board as BoardApi } from '../hooks/useBoard';
import { fileLabel, rankLabel } from '../logic/coords';
import type { Square } from '../types';
import { BoardSquare } from './BoardSquare';
import { ConflictLines } from './ConflictLines';

/** Abaixo disso o gesto conta como clique, acima vira arrasto. */
const DRAG_THRESHOLD_PX = 5;

interface Press {
  pointerId: number;
  startX: number;
  startY: number;
  square: Square;
  queenId: string | null;
  dragging: boolean;
}

interface Props {
  board: BoardApi;
}

export function Board({ board }: Props) {
  const { n, conflicts, conflicted, queenAt, place, remove, move } = board;

  const gridRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<Press | null>(null);

  const [drag, setDrag] = useState<{ id: string; over: Square | null } | null>(
    null,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<Square>({ row: 0, col: 0 });

  const squareFromPoint = useCallback(
    (clientX: number, clientY: number): Square | null => {
      const grid = gridRef.current;
      if (!grid) return null;
      const rect = grid.getBoundingClientRect();
      const col = Math.floor(((clientX - rect.left) / rect.width) * n);
      const row = Math.floor(((clientY - rect.top) / rect.height) * n);
      if (row < 0 || row >= n || col < 0 || col >= n) return null;
      return { row, col };
    },
    [n],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const square = squareFromPoint(event.clientX, event.clientY);
      if (!square) return;

      setSelected(null);
      setFocus(square);

      pressRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        square,
        queenId: queenAt(square)?.id ?? null,
        dragging: false,
      };
      gridRef.current?.setPointerCapture(event.pointerId);
    },
    [queenAt, squareFromPoint],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const press = pressRef.current;
      if (!press || press.pointerId !== event.pointerId || !press.queenId)
        return;

      const distance = Math.hypot(
        event.clientX - press.startX,
        event.clientY - press.startY,
      );
      if (!press.dragging && distance < DRAG_THRESHOLD_PX) return;

      press.dragging = true;
      setDrag({
        id: press.queenId,
        over: squareFromPoint(event.clientX, event.clientY),
      });
    },
    [squareFromPoint],
  );

  const endPress = useCallback(
    (event: PointerEvent<HTMLDivElement>, commit: boolean) => {
      const press = pressRef.current;
      pressRef.current = null;
      setDrag(null);

      if (gridRef.current?.hasPointerCapture(event.pointerId)) {
        gridRef.current.releasePointerCapture(event.pointerId);
      }
      if (!press || press.pointerId !== event.pointerId || !commit) return;

      if (press.dragging && press.queenId) {
        const target = squareFromPoint(event.clientX, event.clientY);
        if (target) move(press.queenId, target);
        return;
      }

      // Gesto curto: rainha sai, casa vazia recebe.
      if (press.queenId) remove(press.queenId);
      else place(press.square);
    },
    [move, place, remove, squareFromPoint],
  );

  const focusSquare = useCallback((square: Square) => {
    setFocus(square);
    document.getElementById(`sq-${square.row}-${square.col}`)?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const row = Number(event.currentTarget.dataset.row);
      const col = Number(event.currentTarget.dataset.col);
      const clamp = (v: number) => Math.max(0, Math.min(n - 1, v));

      const moves: Record<string, Square> = {
        ArrowUp: { row: clamp(row - 1), col },
        ArrowDown: { row: clamp(row + 1), col },
        ArrowLeft: { row, col: clamp(col - 1) },
        ArrowRight: { row, col: clamp(col + 1) },
        Home: { row, col: 0 },
        End: { row, col: n - 1 },
      };

      const target = moves[event.key];
      if (target) {
        event.preventDefault();
        focusSquare(target);
        return;
      }

      if (event.key === 'Escape') {
        setSelected(null);
        return;
      }

      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();

      const square = { row, col };
      const queen = queenAt(square);

      if (!selected) {
        if (queen) setSelected(queen.id);
        else place(square);
        return;
      }

      if (queen?.id === selected) {
        remove(selected);
        setSelected(null);
      } else if (queen) {
        setSelected(queen.id);
      } else {
        move(selected, square);
        setSelected(null);
      }
    },
    [focusSquare, move, n, place, queenAt, remove, selected],
  );

  const ranks = Array.from({ length: n }, (_, row) => row);
  const files = Array.from({ length: n }, (_, col) => col);

  return (
    <div className="board-frame" style={{ '--n': n } as React.CSSProperties}>
      <div className="ranks" aria-hidden="true">
        {ranks.map((row) => (
          <span key={row}>{rankLabel(row, n)}</span>
        ))}
      </div>

      <div
        ref={gridRef}
        className="board"
        role="grid"
        aria-label={`Tabuleiro ${n} por ${n}`}
        aria-rowcount={n}
        aria-colcount={n}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => endPress(event, true)}
        onPointerCancel={(event) => endPress(event, false)}
      >
        {ranks.map((row) => (
          <div className="board-row" role="row" key={row}>
            {files.map((col) => {
              const queen = queenAt({ row, col });
              return (
                <BoardSquare
                  key={col}
                  row={row}
                  col={col}
                  n={n}
                  queen={queen}
                  conflicted={queen ? conflicted.has(queen.id) : false}
                  selected={queen ? queen.id === selected : false}
                  dragging={queen ? queen.id === drag?.id : false}
                  dropTarget={
                    drag?.over?.row === row && drag?.over?.col === col
                  }
                  focusable={focus.row === row && focus.col === col}
                  onKeyDown={handleKeyDown}
                />
              );
            })}
          </div>
        ))}
        <ConflictLines conflicts={conflicts} n={n} />
      </div>

      <div className="corner" aria-hidden="true" />

      <div className="files" aria-hidden="true">
        {files.map((col) => (
          <span key={col}>{fileLabel(col)}</span>
        ))}
      </div>
    </div>
  );
}
