import type { Genome } from './types';

/**
 * Diversidade da populacao: entropia media por locus, normalizada em [0, 1].
 *
 * Para cada linha do tabuleiro monta-se o histograma das colunas ocupadas por
 * aquele gene em toda a populacao, calcula-se a entropia de Shannon e
 * normaliza-se por log2(n). A diversidade e a media das n entropias.
 *
 * Comeca perto de 1 na populacao inicial aleatoria e desce rumo a 0 conforme
 * os genes se uniformizam. E a unica metrica que MEDE a convergencia
 * prematura, em vez de so afirma-la a partir do formato da curva.
 *
 * Custo O(P*n), a mesma ordem que ja se paga para avaliar a populacao.
 */
export function diversity(population: Genome[], n: number): number {
  const p = population.length;
  // Com n = 1 so existe uma coluna possivel: nao ha variedade a medir.
  if (p === 0 || n < 2) return 0;

  const norm = Math.log2(n);
  const counts = new Uint32Array(n);
  let total = 0;

  for (let locus = 0; locus < n; locus++) {
    counts.fill(0);
    for (let k = 0; k < p; k++) counts[population[k][locus]]++;

    let entropy = 0;
    for (let c = 0; c < n; c++) {
      if (counts[c] === 0) continue;
      const prob = counts[c] / p;
      entropy -= prob * Math.log2(prob);
    }
    total += entropy / norm;
  }

  return total / n;
}
