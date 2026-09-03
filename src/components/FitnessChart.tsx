import type { GenerationStats } from '../logic/ga/types';

interface Props {
  history: GenerationStats[];
  optimum: number;
}

const W = 320;
const H = 150;
const PAD_L = 26;
const PAD_R = 26;
const PAD_T = 10;
const PAD_B = 18;

/** Reduz a serie a no maximo `limit` pontos, preservando o ultimo. */
function sample<T>(series: T[], limit: number): T[] {
  if (series.length <= limit) return series;
  const stride = Math.ceil(series.length / limit);
  const out = series.filter((_, i) => i % stride === 0);
  const last = series[series.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

/**
 * A curva serrilhada.
 *
 * Sem elitismo e com substituicao total, o melhor da geracao k pode nao
 * existir na k+1: a curva sobe e desce em vez da escada monotonica que se
 * espera de um otimizador. E o principal produto pedagogico da entrega, e por
 * isso o grafico existe.
 *
 * A diversidade vai no mesmo desenho, em eixo proprio de 0 a 1, porque e ela
 * que explica o achatamento da curva no fim da corrida.
 */
export function FitnessChart({ history, optimum }: Props) {
  if (history.length < 2) {
    return (
      <div className="chart chart--empty">
        <span>O grafico aparece quando a evolucao comecar.</span>
      </div>
    );
  }

  const points = sample(history, 400);
  const lastGeneration = history[history.length - 1].generation;
  const spanX = Math.max(1, lastGeneration);
  const spanY = Math.max(1, optimum);

  const x = (generation: number) => PAD_L + (generation / spanX) * (W - PAD_L - PAD_R);
  const y = (value: number) => H - PAD_B - (value / spanY) * (H - PAD_T - PAD_B);
  const yDiv = (value: number) => H - PAD_B - value * (H - PAD_T - PAD_B);

  const path = (pick: (s: GenerationStats) => number, scale = y) =>
    points.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(s.generation).toFixed(1)} ${scale(pick(s)).toFixed(1)}`).join(' ');

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Aptidao por geracao">
        <line className="chart__axis" x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} />
        <line className="chart__axis" x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} />

        <line
          className="chart__optimum"
          x1={PAD_L}
          y1={y(optimum)}
          x2={W - PAD_R}
          y2={y(optimum)}
        />

        <path className="chart__line chart__line--diversity" d={path((s) => s.diversity, yDiv)} />
        <path className="chart__line chart__line--worst" d={path((s) => s.worst)} />
        <path className="chart__line chart__line--average" d={path((s) => s.average)} />
        <path className="chart__line chart__line--best" d={path((s) => s.best)} />

        <text className="chart__tick" x={PAD_L - 4} y={y(optimum) + 3} textAnchor="end">
          {optimum}
        </text>
        <text className="chart__tick" x={PAD_L - 4} y={H - PAD_B + 3} textAnchor="end">
          0
        </text>
        <text className="chart__tick" x={W - PAD_R + 4} y={PAD_T + 6}>
          1,0
        </text>
        <text className="chart__tick" x={W - PAD_R + 4} y={H - PAD_B + 3}>
          0
        </text>
        <text className="chart__tick" x={W - PAD_R} y={H - 4} textAnchor="end">
          ger. {lastGeneration}
        </text>
      </svg>

      <figcaption className="chart__legend">
        <span className="chart__key chart__key--best">melhor</span>
        <span className="chart__key chart__key--average">media</span>
        <span className="chart__key chart__key--worst">pior</span>
        <span className="chart__key chart__key--diversity">diversidade</span>
      </figcaption>
    </figure>
  );
}
