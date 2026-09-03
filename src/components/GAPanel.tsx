import type { GA } from '../hooks/useGA';
import { DEFAULT_BATCH_RUNS } from '../logic/ga/types';
import { MAX_N } from '../types';
import { FitnessChart } from './FitnessChart';

interface Props {
  ga: GA;
}

interface NumberFieldProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

function NumberField({ label, hint, value, min, max, step, disabled, onChange }: NumberFieldProps) {
  return (
    <label className="ga-field">
      <span className="ga-field__label">
        {label}
        {hint ? <em className="ga-field__hint">{hint}</em> : null}
      </span>
      <input
        className="ga-field__input"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
      />
    </label>
  );
}

const STATUS_LABEL: Record<GA['status'], string> = {
  idle: 'parado',
  running: 'evoluindo',
  paused: 'pausado',
  done: 'encerrado',
};

/**
 * Controles do AG e leitura da geracao corrente.
 *
 * Todos os parametros sao editaveis porque sao eles o objeto de estudo — o
 * ponto da entrega nao e resolver o tabuleiro, e medir o comportamento do AG.
 */
export function GAPanel({ ga }: Props) {
  const { params, current, status, optimum, record, batch } = ga;
  const locked = status === 'running' || status === 'paused' || ga.busy;

  return (
    <section className="panel ga">
      <h2 className="panel__title">Algoritmo genetico</h2>

      <div className="ga-params">
        <NumberField
          label="Populacao"
          value={params.populationSize}
          min={2}
          max={1000}
          disabled={locked}
          onChange={(populationSize) => ga.updateParams({ populationSize })}
        />
        <NumberField
          label="Crossover pc"
          hint="0,6 a 0,9"
          value={params.crossoverRate}
          min={0}
          max={1}
          step={0.05}
          disabled={locked}
          onChange={(crossoverRate) => ga.updateParams({ crossoverRate })}
        />
        <NumberField
          label="Mutacao pm"
          hint="por gene"
          value={params.mutationRate}
          min={0}
          max={1}
          step={0.01}
          disabled={locked}
          onChange={(mutationRate) => ga.updateParams({ mutationRate })}
        />
        <NumberField
          label="Max. geracoes"
          value={params.maxGenerations}
          min={1}
          max={20000}
          disabled={locked}
          onChange={(maxGenerations) => ga.updateParams({ maxGenerations })}
        />
        <NumberField
          label="Semente"
          hint="reproduz o run"
          value={params.seed}
          min={0}
          max={2 ** 31}
          disabled={locked}
          onChange={(seed) => ga.updateParams({ seed })}
        />
        <NumberField
          label="Ger. por quadro"
          hint="velocidade"
          value={ga.speed}
          min={1}
          max={200}
          disabled={ga.busy}
          onChange={ga.setSpeed}
        />
      </div>

      <div className="ga-actions">
        {status === 'running' ? (
          <button type="button" className="btn" onClick={ga.pause}>
            Pausar
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={status === 'paused' ? ga.resume : ga.start}
            disabled={ga.busy}
          >
            {status === 'paused' ? 'Continuar' : 'Evoluir'}
          </button>
        )}
        <button
          type="button"
          className="btn"
          onClick={ga.stepOnce}
          disabled={status !== 'paused' && status !== 'running'}
        >
          Passo
        </button>
        <button
          type="button"
          className="btn"
          onClick={ga.reset}
          disabled={status === 'idle' || ga.busy}
        >
          Zerar
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => ga.runBatchNow(DEFAULT_BATCH_RUNS)}
          disabled={ga.busy || status === 'running'}
        >
          {ga.busy ? 'Rodando...' : `Lote de ${DEFAULT_BATCH_RUNS}`}
        </button>
      </div>

      <div className="counters">
        <div className="counter">
          <span className="counter__value">{current ? current.generation : '—'}</span>
          <span className="counter__label">geracao</span>
        </div>
        <div className={`counter${current?.solved ? '' : ' counter--bad'}`}>
          <span className="counter__value">
            {current ? current.best : '—'}
            <span className="counter__total">/{optimum}</span>
          </span>
          <span className="counter__label">aptidao</span>
        </div>
        <div className="counter">
          <span className="counter__value">
            {current ? current.diversity.toFixed(2) : '—'}
          </span>
          <span className="counter__label">diversidade</span>
        </div>
      </div>

      <p className="ga-status">
        {STATUS_LABEL[status]}
        {current ? ` · media ${current.average.toFixed(1)} · pior ${current.worst}` : ''}
      </p>

      {ga.error ? <p className="banner banner--warn">{ga.error}</p> : null}

      {record ? (
        <p className={`banner ${record.solved ? 'banner--ok' : 'banner--warn'}`}>
          {record.solved
            ? `Resolvido na geracao ${record.generations}, em ${record.elapsedMs} ms.`
            : `Nao resolvido em ${record.generations} geracoes. Melhor aptidao ${record.bestFitness} de ${record.maxFitness}.`}
        </p>
      ) : null}

      <FitnessChart history={ga.history} optimum={optimum} />

      {batch ? (
        <div className="ga-batch">
          <h3 className="panel__title">
            Lote · {batch.runs} execucoes, n={batch.params.n}
          </h3>
          <ul className="ga-batch__stats">
            <li>
              <strong>
                {batch.solvedCount}/{batch.runs}
              </strong>{' '}
              resolvidos · taxa {(batch.successRate * 100).toFixed(0)}%
            </li>
            <li>
              media{' '}
              <strong>
                {Number.isNaN(batch.meanGenerations)
                  ? '—'
                  : batch.meanGenerations.toFixed(0)}
              </strong>{' '}
              geracoes · desvio{' '}
              {Number.isNaN(batch.stdDevGenerations)
                ? '—'
                : batch.stdDevGenerations.toFixed(0)}
            </li>
          </ul>
          <p className="hints">
            Media e desvio saem apenas dos runs resolvidos. Sementes{' '}
            {batch.params.seed} a {batch.params.seed + batch.runs - 1}.
          </p>
        </div>
      ) : null}

      <p className="hints">
        A curva do melhor desce de proposito: nao ha elitismo nem hall of fame,
        entao o melhor da geracao pode nao sobreviver a seguinte. Com n acima de{' '}
        {Math.min(10, MAX_N)} a taxa de sucesso despenca — e o resultado, nao um
        defeito.
      </p>
    </section>
  );
}
