//@version=1

const calculateSMA = (source, length) => {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    const value = source(i);
    if (!Number.isFinite(value)) return NaN;
    sum += value;
  }
  return sum / length;
};

const calculateStdDev = (source, length, mean) => {
  let sumSq = 0;
  for (let i = 0; i < length; i++) {
    const value = source(i);
    if (!Number.isFinite(value)) return NaN;
    const diff = value - mean;
    sumSq += diff * diff;
  }
  return Math.sqrt(sumSq / length);
};

init = () => {
  indicator({ onMainPanel: true, format: 'inherit' });

  input.src('Source', 'close', 'source', undefined, 'Bollinger Bands');
  input.int('Length', 20, 'bbLength', 1, 500, 1, 'Lookback for the basis and bands', 'Bollinger Bands');
  input.float('StdDev Multiplier', 2.0, 'bbMult', 0.1, 10, 0.1, 'Standard deviation multiplier', 'Bollinger Bands');

  input.color('Basis Color', color.rgba(255, 255, 255, 1), 'basisColor', 'Style');
  input.color('Upper Band Color', color.rgba(0, 170, 255, 1), 'upperColor', 'Style');
  input.color('Lower Band Color', color.rgba(0, 170, 255, 1), 'lowerColor', 'Style');
};

onTick = (length, _moment, _, ta, inputs) => {
  const source = inputs.source;
  const bbLength = inputs.bbLength;
  const bbMult = inputs.bbMult;

  if (index < bbLength - 1) return;

  const basis = calculateSMA(source, bbLength);
  if (!Number.isFinite(basis)) return;

  const stdDev = calculateStdDev(source, bbLength, basis);
  if (!Number.isFinite(stdDev)) return;

  const upperBand = basis + stdDev * bbMult;
  const lowerBand = basis - stdDev * bbMult;

  if (![upperBand, lowerBand].every(Number.isFinite)) return;

  plot.line('BB Basis', basis, inputs.basisColor, 0);
  plot.line('BB Upper', upperBand, inputs.upperColor, 0);
  plot.line('BB Lower', lowerBand, inputs.lowerColor, 0);
};
