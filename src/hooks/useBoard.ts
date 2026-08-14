import { useCallback, useMemo, useRef, useState } from 'react';
import { fitQueens } from '../logic/board';
import { conflictingIds, detectConflicts } from '../logic/conflicts';
import type { Queen, Square } from '../types';
import { DEFAULT_N } from '../types';

const HISTORY_LIMIT = 50;

interface BoardState {
  queens: Queen[];
  history: Queen[][];
}

const EMPTY: BoardState = { queens: [], history: [] };

export function useBoard(initialN: number = DEFAULT_N) {
  const [n, setN] = useState(initialN);
  const [state, setState] = useState<BoardState>(EMPTY);
  const nextId = useRef(0);

  /**
   * Aplica uma transformacao no tabuleiro empilhando o estado anterior.
   * Se fn devolve null, nada muda e nada entra no historico.
   */
  const apply = useCallback((fn: (queens: Queen[]) => Queen[] | null) => {
    setState((s) => {
      const next = fn(s.queens);
      if (!next) return s;
      return {
        queens: next,
        history: [...s.history, s.queens].slice(-HISTORY_LIMIT),
      };
    });
  }, []);

  const queenAt = useCallback(
    ({ row, col }: Square) =>
      state.queens.find((q) => q.row === row && q.col === col),
    [state.queens],
  );

  const place = useCallback(
    ({ row, col }: Square) => {
      apply((queens) => {
        if (queens.length >= n) return null;
        if (queens.some((q) => q.row === row && q.col === col)) return null;
        nextId.current += 1;
        return [...queens, { id: `q${nextId.current}`, row, col }];
      });
    },
    [apply, n],
  );

  const remove = useCallback(
    (id: string) => {
      apply((queens) => {
        if (!queens.some((q) => q.id === id)) return null;
        return queens.filter((q) => q.id !== id);
      });
    },
    [apply],
  );

  /** Move sem checar regra de xadrez: qualquer casa vazia serve. */
  const move = useCallback(
    (id: string, { row, col }: Square) => {
      apply((queens) => {
        const queen = queens.find((q) => q.id === id);
        if (!queen) return null;
        if (queen.row === row && queen.col === col) return null;
        const occupied = queens.some(
          (q) => q.id !== id && q.row === row && q.col === col,
        );
        if (occupied) return null;
        return queens.map((q) => (q.id === id ? { ...q, row, col } : q));
      });
    },
    [apply],
  );

  const undo = useCallback(() => {
    setState((s) => {
      if (s.history.length === 0) return s;
      return {
        queens: s.history[s.history.length - 1],
        history: s.history.slice(0, -1),
      };
    });
  }, []);

  const clear = useCallback(() => {
    apply((queens) => (queens.length === 0 ? null : []));
  }, [apply]);

  /**
   * Troca o tamanho do tabuleiro preservando as rainhas que ainda cabem.
   * O historico e' descartado: os estados anteriores pertencem a um grid
   * de outro tamanho e desfazer para eles nao faria sentido.
   */
  const resize = useCallback((next: number) => {
    setN(next);
    setState((s) => ({ queens: fitQueens(s.queens, next), history: [] }));
  }, []);

  /** Volta ao tabuleiro vazio no tamanho pedido. */
  const reset = useCallback((next: number) => {
    setN(next);
    setState(EMPTY);
  }, []);

  const conflicts = useMemo(() => detectConflicts(state.queens), [state.queens]);
  const conflicted = useMemo(() => conflictingIds(conflicts), [conflicts]);

  return {
    n,
    queens: state.queens,
    conflicts,
    conflicted,
    remaining: n - state.queens.length,
    solved: state.queens.length === n && conflicts.length === 0,
    canUndo: state.history.length > 0,
    queenAt,
    place,
    remove,
    move,
    undo,
    clear,
    resize,
    reset,
  };
}

export type Board = ReturnType<typeof useBoard>;
