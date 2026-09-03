import type { Queen } from '../../types';
import { randomInt } from './random';
import type { Genome, Random } from './types';

/**
 * Genoma aleatorio de n genes, cada um em [0, n).
 * Todo genoma sorteado assim ja e valido: nao existe reparo em lugar nenhum.
 */
export function randomGenome(n: number, rand: Random): Genome {
  const genome: Genome = new Array<number>(n);
  for (let i = 0; i < n; i++) genome[i] = randomInt(rand, n);
  return genome;
}

/**
 * Fenotipo: o genoma desenhado no tabuleiro.
 * Uma rainha por linha, sempre — o indice do gene E a linha.
 */
export function genomeToQueens(genome: Genome): Queen[] {
  return genome.map((col, row) => ({ id: `q${row + 1}`, row, col }));
}

/**
 * Caminho inverso, para semear o AG com o tabuleiro montado a mao.
 * Devolve null se a configuracao nao tem exatamente uma rainha por linha,
 * porque essa e a unica coisa que esta representacao nao consegue expressar.
 */
export function queensToGenome(queens: Queen[], n: number): Genome | null {
  if (queens.length !== n) return null;
  const genome: Genome = new Array<number>(n).fill(-1);
  for (const { row, col } of queens) {
    if (row < 0 || row >= n || col < 0 || col >= n) return null;
    if (genome[row] !== -1) return null;
    genome[row] = col;
  }
  return genome.includes(-1) ? null : genome;
}
