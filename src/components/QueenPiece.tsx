interface Props {
  conflicted: boolean;
  dragging: boolean;
  selected: boolean;
}

/** Silhueta de rainha de xadrez. Herda a cor via currentColor. */
export function QueenPiece({ conflicted, dragging, selected }: Props) {
  const classes = ['queen'];
  if (conflicted) classes.push('queen--conflicted');
  if (dragging) classes.push('queen--dragging');
  if (selected) classes.push('queen--selected');

  return (
    <svg className={classes.join(' ')} viewBox="0 0 45 45" aria-hidden="true">
      <g>
        <circle cx="6" cy="12" r="2.75" />
        <circle cx="14" cy="9" r="2.75" />
        <circle cx="22.5" cy="8" r="2.75" />
        <circle cx="31" cy="9" r="2.75" />
        <circle cx="39" cy="12" r="2.75" />
        <path d="M9,26C17.5,24.5 30,24.5 36,26L38.5,13.5L31,25L30.7,10.9L25.5,24.5L22.5,10L19.5,24.5L14.3,10.9L14,25L6.5,13.5L9,26Z" />
        <path d="M9,26C9,28 10.5,28 11.5,30C12.5,31.5 12.5,31 12,33.5C10.5,34.5 10.5,36 10.5,36C9,37.5 11,38.5 11,38.5C17.5,39.5 27.5,39.5 34,38.5C34,38.5 35.5,37.5 34,36C34,36 34.5,34.5 33,33.5C32.5,31 32.5,31.5 33.5,30C34.5,28 36,28 36,26C27.5,24.5 17.5,24.5 9,26Z" />
      </g>
    </svg>
  );
}
