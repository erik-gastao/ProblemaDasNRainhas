import { useCallback, useEffect, useRef, useState } from 'react';
import type { RunSummary } from '../storage/runsDb';
import {
  clearRuns,
  deleteRun,
  exportRuns,
  importRuns,
  isStorageAvailable,
  listRuns,
} from '../storage/runsDb';

interface Props {
  /** Muda quando uma execucao termina, para recarregar a lista. */
  refreshKey: number;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Historico persistido em IndexedDB, com export e import JSON.
 *
 * A lista mostra so o resumo; a serie completa fica no banco e nao e
 * carregada para desenhar isto.
 */
export function RunHistory({ refreshKey }: Props) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const report = useCallback((cause: unknown) => {
    setError(cause instanceof Error ? cause.message : String(cause));
  }, []);

  const reload = useCallback(() => {
    if (!isStorageAvailable()) return;
    listRuns()
      .then((loaded) => {
        setRuns(loaded);
        setError(null);
      })
      .catch(report);
  }, [report]);

  useEffect(reload, [reload, refreshKey]);

  const download = useCallback(() => {
    exportRuns()
      .then((json) => {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `nrainhas-runs-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch(report);
  }, [report]);

  const upload = useCallback(
    (file: File) => {
      file
        .text()
        .then(importRuns)
        .then(reload)
        .catch(report);
    },
    [reload, report],
  );

  if (!isStorageAvailable()) {
    return (
      <section className="panel">
        <h2 className="panel__title">Historico</h2>
        <p className="banner banner--warn">
          IndexedDB indisponivel. Abra o app por http://localhost — sob file:// o
          navegador bloqueia o banco.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Historico · {runs.length} execucoes</h2>

      <div className="ga-actions">
        <button type="button" className="btn" onClick={download} disabled={runs.length === 0}>
          Exportar JSON
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          Importar
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => clearRuns().then(reload).catch(report)}
          disabled={runs.length === 0}
        >
          Apagar tudo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = '';
          }}
        />
      </div>

      {error ? <p className="banner banner--warn">{error}</p> : null}

      {runs.length === 0 ? (
        <p className="hints">Nenhuma execucao gravada ainda.</p>
      ) : (
        <ul className="run-list">
          {runs.slice(0, 40).map((run) => (
            <li key={run.id} className={run.solved ? 'run-list__item run-list__item--ok' : 'run-list__item'}>
              <span className="run-list__head">
                n={run.params.n} · pm={run.params.mutationRate} · semente {run.params.seed}
              </span>
              <span className="run-list__body">
                {run.solved ? `resolvido em ${run.generations} ger.` : `parou em ${run.generations} ger.`}
                {' · '}
                {run.bestFitness}/{run.maxFitness} · {run.elapsedMs} ms
              </span>
              <span className="run-list__foot">
                {formatDate(run.createdAt)}
                <button
                  type="button"
                  className="run-list__del"
                  onClick={() => deleteRun(run.id).then(reload).catch(report)}
                  aria-label={`Apagar execucao ${run.id}`}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
