import type { Board } from '../hooks/useBoard';
import { squareName } from '../logic/coords';

interface Props {
  board: Board;
}

export function StatusPanel({ board }: Props) {
  const { n, queens, conflicts, remaining, solved } = board;

  return (
    <aside className="panel">
      <div className="counters">
        <div className="counter">
          <span className="counter__value">
            {queens.length}
            <span className="counter__total">/{n}</span>
          </span>
          <span className="counter__label">rainhas</span>
        </div>
        <div
          className={`counter ${conflicts.length > 0 ? 'counter--bad' : ''}`}
        >
          <span className="counter__value">{conflicts.length}</span>
          <span className="counter__label">
            {conflicts.length === 1 ? 'conflito' : 'conflitos'}
          </span>
        </div>
      </div>

      {solved && (
        <p className="banner banner--ok" role="status">
          Configuracao valida: as {n} rainhas colocadas, nenhuma se ataca.
        </p>
      )}

      {!solved && conflicts.length === 0 && remaining > 0 && (
        <p className="banner" role="status">
          Sem conflitos. Faltam {remaining}{' '}
          {remaining === 1 ? 'rainha' : 'rainhas'}.
        </p>
      )}

      {conflicts.length > 0 && (
        <>
          <h2 className="panel__title">Conflitos</h2>
          <ul className="conflict-list">
            {conflicts.map(({ a, b, kind }) => (
              <li key={`${a.id}-${b.id}`}>
                <strong>{squareName(a.row, a.col, n)}</strong>
                <span className="conflict-list__x">x</span>
                <strong>{squareName(b.row, b.col, n)}</strong>
                <span className="conflict-list__kind">{kind}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="panel__title">Como usar</h2>
      <ul className="hints">
        <li>Clique numa casa vazia para colocar uma rainha.</li>
        <li>Clique numa rainha para remove-la.</li>
        <li>Arraste uma rainha para qualquer casa vazia.</li>
        <li>
          Teclado: setas movem o foco, <kbd>Enter</kbd> coloca, seleciona ou
          solta, <kbd>Esc</kbd> cancela a selecao.
        </li>
      </ul>
    </aside>
  );
}
