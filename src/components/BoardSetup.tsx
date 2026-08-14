import { useState } from 'react';
import { DEFAULT_N, MAX_N, MIN_N } from '../types';

const PRESETS = [4, 6, 8, 12, 16];

interface Props {
  initialN?: number;
  onStart: (n: number) => void;
}

export function BoardSetup({ initialN = DEFAULT_N, onStart }: Props) {
  const [n, setN] = useState(initialN);

  return (
    <section className="setup">
      <h1 className="setup__title">Problema das N rainhas</h1>
      <p className="setup__lead">
        Escolha quantas rainhas. O tabuleiro fica N x N e recebe no maximo N
        rainhas.
      </p>

      <div className="setup__value">
        <span className="setup__n">{n}</span>
        <span className="setup__dim">
          rainhas em um tabuleiro {n} x {n}
        </span>
      </div>

      <label className="setup__slider">
        <span className="sr-only">Numero de rainhas</span>
        <input
          type="range"
          min={MIN_N}
          max={MAX_N}
          step={1}
          value={n}
          onChange={(event) => setN(Number(event.target.value))}
        />
        <div className="setup__scale">
          <span>{MIN_N}</span>
          <span>{MAX_N}</span>
        </div>
      </label>

      <div className="setup__presets">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`chip ${preset === n ? 'chip--active' : ''}`}
            onClick={() => setN(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      <p className="setup__note">
        Da' para mudar o tamanho depois, pela barra no topo do tabuleiro.
      </p>

      <div className="setup__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => onStart(n)}
        >
          Comecar
        </button>
      </div>
    </section>
  );
}
