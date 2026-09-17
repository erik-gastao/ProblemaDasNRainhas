import { useEffect, useState } from 'react';
import './App.css';
import { Board } from './components/Board';
import { BoardSetup } from './components/BoardSetup';
import { GAPanel } from './components/GAPanel';
import { RunHistory } from './components/RunHistory';
import { SizeSlider } from './components/SizeSlider';
import { StatusPanel } from './components/StatusPanel';
import { useBoard } from './hooks/useBoard';
import { useGA } from './hooks/useGA';
import { genomeToQueens } from './logic/ga/genome';

type Mode = 'manual' | 'ga';

export default function App() {
  const board = useBoard();
  const ga = useGA(board.n);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<Mode>('manual');
  const [refreshKey, setRefreshKey] = useState(0);

  const { setQueens } = board;
  const bestGenome = ga.current?.bestGenome;

  // O fenotipo do melhor individuo vai para o tabuleiro. E aqui que a
  // evolucao vira imagem: as rainhas deslizam casa a casa, geracao a geracao.
  useEffect(() => {
    if (mode !== 'ga' || !bestGenome) return;
    setQueens(genomeToQueens(bestGenome));
  }, [mode, bestGenome, setQueens]);

  // Uma execucao encerrada, ou um lote, acabou de gravar no banco.
  const { record, batch } = ga;
  useEffect(() => {
    if (record || batch) setRefreshKey((k) => k + 1);
  }, [record, batch]);

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

  const running = ga.status === 'running';

  return (
    <main className="app">
      <header className="topbar">
        <h1 className="topbar__title">Problema das N rainhas</h1>
        <SizeSlider n={board.n} onChange={board.resize} />

        <div className="mode-switch" role="group" aria-label="Modo">
          <button
            type="button"
            className={`chip${mode === 'manual' ? ' chip--active' : ''}`}
            onClick={() => setMode('manual')}
            disabled={running}
          >
            Manual
          </button>
          <button
            type="button"
            className={`chip${mode === 'ga' ? ' chip--active' : ''}`}
            onClick={() => setMode('ga')}
          >
            Genetico
          </button>
        </div>

        <div className="topbar__actions">
          {mode === 'manual' ? (
            <>
              <button
                type="button"
                className="btn"
                onClick={board.addQueen}
                disabled={board.remaining === 0}
              >
                Adicionar rainha
              </button>
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
            </>
          ) : null}
        </div>
      </header>

      <div className="layout">
        <Board board={board} />
        {mode === 'manual' ? (
          <StatusPanel board={board} />
        ) : (
          <>
            <GAPanel ga={ga} />
            <RunHistory refreshKey={refreshKey} />
          </>
        )}
      </div>
    </main>
  );
}
