import type { Genome } from './types';

/** Pares distintos dentro de um grupo de k rainhas. */
function pairsOf(k: number): number {
  return (k * (k - 1)) / 2;
}

/** Total de pares de rainhas no tabuleiro: C(n,2). E o otimo global. */
export function maxFitness(n: number): number {
  return pairsOf(n);
}

/**
 * Pares de rainhas que se atacam, em O(n).
 *
 * Conflito de linha e impossivel por construcao (um gene por linha), entao
 * sobram coluna e as duas diagonais. Tres arrays de contadores, somando
 * C(k,2) por grupo.
 *
 * O indice das diagonais e o ponto nao obvio: `i - col` varia de -(n-1) a
 * n-1, ou seja, e negativo em metade dos casos. Soma-se n-1 para deslocar a
 * faixa para 0..2n-2, e por isso os arrays diagonais tem tamanho 2n-1.
 *
 * Os tres grupos sao disjuntos: duas rainhas nao podem estar na mesma coluna
 * E na mesma diagonal (exigiria mesma linha), nem nas duas diagonais ao mesmo
 * tempo (exigiria serem a mesma casa). Logo a soma nao conta par duas vezes.
 */
export function collisions(genome: Genome): number {
  const n = genome.length;
  if (n < 2) return 0;

  const diagonals = 2 * n - 1;
  const col = new Uint16Array(n);
  const desc = new Uint16Array(diagonals);
  const asc = new Uint16Array(diagonals);

  for (let i = 0; i < n; i++) {
    const c = genome[i];
    col[c]++;
    desc[i - c + n - 1]++;
    asc[i + c]++;
  }

  let total = 0;
  for (let i = 0; i < n; i++) total += pairsOf(col[i]);
  for (let i = 0; i < diagonals; i++) total += pairsOf(desc[i]) + pairsOf(asc[i]);
  return total;
}

/**
 * Aptidao: pares de rainhas em paz.
 * Sempre >= 0, requisito da selecao por roleta, e igual a maxFitness(n)
 * apenas quando nao existe nenhuma colisao.
 */
export function fitness(genome: Genome): number {
  return maxFitness(genome.length) - collisions(genome);
}
