import { MAX_N, MIN_N } from '../types';

interface Props {
  n: number;
  onChange: (n: number) => void;
}

/** Barra que muda o tamanho do tabuleiro ao vivo. */
export function SizeSlider({ n, onChange }: Props) {
  return (
    <div className="size-slider">
      <label className="size-slider__label" htmlFor="size-slider-input">
        Tabuleiro
      </label>
      <input
        id="size-slider-input"
        className="size-slider__input"
        type="range"
        min={MIN_N}
        max={MAX_N}
        step={1}
        value={n}
        aria-label="Tamanho do tabuleiro"
        aria-valuetext={`${n} por ${n}, ${n} rainhas`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output className="size-slider__value" htmlFor="size-slider-input">
        {n} x {n}
      </output>
    </div>
  );
}
