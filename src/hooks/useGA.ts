import { useCallback, useEffect, useRef, useState } from 'react';
import { evolve } from '../logic/ga/evolve';
import { maxFitness } from '../logic/ga/fitness';
import { runBatch } from '../logic/ga/run';
import type {
  BatchSummary,
  GAParams,
  GenerationStats,
  RunRecord,
} from '../logic/ga/types';
import {
  DEFAULT_CROSSOVER_RATE,
  DEFAULT_MAX_GENERATIONS,
  DEFAULT_MUTATION_RATE,
  DEFAULT_POPULATION_SIZE,
} from '../logic/ga/types';
import { saveRun } from '../storage/runsDb';

export type GAStatus = 'idle' | 'running' | 'paused' | 'done';

/**
 * Consumidor VISUAL do gerador `evolve`: puxa uma ou mais geracoes por quadro
 * de animacao, o que mantem a interface responsiva e permite pausar e avancar
 * passo a passo.
 *
 * O gerador vive num ref, nunca no corpo do componente. Isso e o que garante
 * a reprodutibilidade: o StrictMode do React executa efeitos duas vezes em
 * desenvolvimento, e um gerador criado durante a renderizacao consumiria o
 * PRNG em ordem diferente entre `dev` e `build`.
 */
export function useGA(n: number) {
  const [params, setParams] = useState<GAParams>({
    n,
    populationSize: DEFAULT_POPULATION_SIZE,
    crossoverRate: DEFAULT_CROSSOVER_RATE,
    mutationRate: DEFAULT_MUTATION_RATE,
    maxGenerations: DEFAULT_MAX_GENERATIONS,
    seed: 1,
  });
  const [status, setStatus] = useState<GAStatus>('idle');
  const [history, setHistory] = useState<GenerationStats[]>([]);
  const [record, setRecord] = useState<RunRecord | null>(null);
  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Geracoes consumidas por quadro. Acima de 1, a evolucao corre mais rapido. */
  const [speed, setSpeed] = useState(1);

  const generatorRef = useRef<Generator<GenerationStats> | null>(null);
  const frameRef = useRef<number | null>(null);
  const historyRef = useRef<GenerationStats[]>([]);
  const startedAtRef = useRef(0);
  const speedRef = useRef(speed);
  const paramsRef = useRef(params);

  speedRef.current = speed;
  paramsRef.current = params;

  const cancelFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  /** Fecha a execucao, monta o registro e grava. */
  const finish = useCallback(() => {
    cancelFrame();
    generatorRef.current = null;

    const series = historyRef.current;
    const last = series[series.length - 1];
    if (!last) {
      setStatus('idle');
      return;
    }

    const finished: RunRecord = {
      params: paramsRef.current,
      solved: last.solved,
      generations: last.generation,
      bestFitness: last.best,
      maxFitness: maxFitness(paramsRef.current.n),
      bestGenome: last.bestGenome,
      elapsedMs: Date.now() - startedAtRef.current,
      history: series,
    };

    setRecord(finished);
    setStatus('done');
    saveRun(finished).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    });
  }, [cancelFrame]);

  /** Avanca `count` geracoes. Devolve true se a execucao acabou. */
  const advance = useCallback((count: number) => {
    const generator = generatorRef.current;
    if (!generator) return true;

    for (let i = 0; i < count; i++) {
      const step = generator.next();
      if (step.done) return true;
      historyRef.current.push(step.value);
    }
    return false;
  }, []);

  const tick = useCallback(() => {
    const done = advance(speedRef.current);
    setHistory(historyRef.current.slice());
    if (done) {
      finish();
      return;
    }
    frameRef.current = requestAnimationFrame(tick);
  }, [advance, finish]);

  const start = useCallback(() => {
    cancelFrame();
    setError(null);
    setRecord(null);
    setBatch(null);
    historyRef.current = [];
    startedAtRef.current = Date.now();
    generatorRef.current = evolve(paramsRef.current);
    setHistory([]);
    setStatus('running');
    frameRef.current = requestAnimationFrame(tick);
  }, [cancelFrame, tick]);

  const pause = useCallback(() => {
    cancelFrame();
    setStatus((s) => (s === 'running' ? 'paused' : s));
  }, [cancelFrame]);

  const resume = useCallback(() => {
    if (!generatorRef.current) return;
    setStatus('running');
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  /** Uma geracao exata, para inspecionar a evolucao com calma. */
  const stepOnce = useCallback(() => {
    if (!generatorRef.current) return;
    cancelFrame();
    const done = advance(1);
    setHistory(historyRef.current.slice());
    if (done) finish();
    else setStatus('paused');
  }, [advance, cancelFrame, finish]);

  const reset = useCallback(() => {
    cancelFrame();
    generatorRef.current = null;
    historyRef.current = [];
    setHistory([]);
    setRecord(null);
    setBatch(null);
    setError(null);
    setStatus('idle');
  }, [cancelFrame]);

  /**
   * Consumidor de LOTE: laco sincrono, sem quadro de animacao.
   *
   * Trava a interface enquanto roda — 30 execucoes de n=8 levam cerca de meio
   * segundo. O `setTimeout` existe so para o navegador conseguir pintar o
   * estado "rodando" antes do bloqueio.
   */
  const runBatchNow = useCallback((runs: number) => {
    cancelFrame();
    generatorRef.current = null;
    setError(null);
    setBusy(true);
    setStatus('idle');

    setTimeout(() => {
      try {
        const summary = runBatch(paramsRef.current, runs);
        setBatch(summary);
        for (const run of summary.records) {
          saveRun(run).catch((cause: unknown) => {
            setError(cause instanceof Error ? cause.message : String(cause));
          });
        }
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setBusy(false);
      }
    }, 0);
  }, [cancelFrame]);

  const updateParams = useCallback((patch: Partial<GAParams>) => {
    setParams((current) => ({ ...current, ...patch }));
  }, []);

  // O tamanho do tabuleiro e do app, nao do painel. Ao mudar, o painel segue
  // e descarta a execucao: ela pertencia a um problema de outra dimensao,
  // como o historico do useBoard ao redimensionar.
  const lastN = useRef(n);
  useEffect(() => {
    if (lastN.current === n) return;
    lastN.current = n;
    reset();
    setParams((current) => ({ ...current, n }));
  }, [n, reset]);

  useEffect(() => cancelFrame, [cancelFrame]);

  const current = history.length > 0 ? history[history.length - 1] : null;

  return {
    params,
    updateParams,
    status,
    busy,
    error,
    speed,
    setSpeed,
    history,
    current,
    record,
    batch,
    optimum: maxFitness(params.n),
    canStart: status === 'idle' || status === 'done',
    start,
    pause,
    resume,
    stepOnce,
    reset,
    runBatchNow,
  };
}

export type GA = ReturnType<typeof useGA>;
