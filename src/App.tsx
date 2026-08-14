import { useState } from 'react';
import './App.css';
import { Board } from './components/Board';
import { BoardSetup } from './components/BoardSetup';
import { SizeSlider } from './components/SizeSlider';
import { StatusPanel } from './components/StatusPanel';
import { useBoard } from './hooks/useBoard';

export default function App() {
  const board = useBoard();
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <main className="app app--setup">
        <BoardSetup
          initialN={board.n}
          onStart={(n) => {
            board.reset(n);
            setStarted(true);
          }}
        />
      </main>
    );
  }

  return (
    <main className="app">
      <header className="topbar">
        <h1 className="topbar__title">Problema das N rainhas</h1>
        <SizeSlider n={board.n} onChange={board.resize} />
        <div className="topbar__actions">
          <button
            type="button"
            className="btn"
            onClick={board.undo}
            disabled={!board.canUndo}
          >
            Desfazer
          </button>
          <button
            type="button"
            className="btn"
            onClick={board.clear}
            disabled={board.queens.length === 0}
          >
            Limpar
          </button>
        </div>
      </header>

      <div className="layout">
        <Board board={board} />
        <StatusPanel board={board} />
      </div>
    </main>
  );
}
