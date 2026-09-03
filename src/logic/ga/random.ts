import type { Random } from './types';

/**
 * mulberry32: PRNG de 32 bits com semente.
 *
 * Math.random() nao aceita semente, e sem semente nenhuma execucao pode ser
 * repetida. Este gerador e a fundacao da bancada de experimentos: mesma
 * semente + mesmos parametros = exatamente a mesma evolucao, gene por gene.
 */
export function mulberry32(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inteiro em [0, max). Consome exatamente um numero do gerador. */
export function randomInt(rand: Random, max: number): number {
  return Math.floor(rand() * max);
}
