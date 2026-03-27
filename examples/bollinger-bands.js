//@version=1

const fxrCalculateSMA = (fxrSourceSeries, fxrPeriod) => {
  let sum = 0;
  for (let i = 0; i < fxrPeriod; i++) {
    const fxrValue = fxrSourceSeries(i);
    if (!Number.isFinite(fxrValue)) return NaN;
    sum += fxrValue;
  }
  return sum / fxrPeriod;
};

const fxrCalculateStdDev = (fxrSourceSeries, fxrPeriod, fxrMean) => {
  let sumSq = 0;
  for (let i = 0; i < fxrPeriod; i++) {
    const fxrValue = fxrSourceSeries(i);
    if (!Number.isFinite(fxrValue)) return NaN;
    const fxrDiff = fxrValue - fxrMean;
    sumSq += fxrDiff * fxrDiff;
  }
  return Math.sqrt(sumSq / fxrPeriod);
};

init = () => {
  indicator({ onMainPanel: true, format: 'inherit' });

  input.src('Source', 'close', 'fxrBbSource', 'Bollinger Bands');
  input.int('BB Length', 20, 'fxrBbLength', 1, 500, 1, 'Number of bars used for the basis and bands', 'Bollinger Bands');
  input.float('StdDev Multiplier', 2.0, 'fxrBbMultiplier', 0.1, 10, 0.1, 'Standard deviation multiplier applied to the bands', 'Bollinger Bands');

  input.color('Basis Color', color.rgba(255, 255, 255, 1), 'fxrBbBasisColor', 'Style');
  input.color('Upper Band Color', color.rgba(0, 170, 255, 1), 'fxrBbUpperColor', 'Style');
  input.color('Lower Band Color', color.rgba(0, 170, 255, 1), 'fxrBbLowerColor', 'Style');
};

onTick = (length, _moment, _, ta, inputs) => {
  const fxrBbSource = inputs['fxrBbSource'];
  const fxrBbLength = inputs['fxrBbLength'];
  const fxrBbMultiplier = inputs['fxrBbMultiplier'];
  const fxrBbBasisColor = inputs['fxrBbBasisColor'];
  const fxrBbUpperColor = inputs['fxrBbUpperColor'];
  const fxrBbLowerColor = inputs['fxrBbLowerColor'];

  if (typeof fxrBbSource !== 'function') return;
  if (!Number.isFinite(fxrBbLength) || fxrBbLength < 1) return;
  if (!Number.isFinite(fxrBbMultiplier)) return;
  if (index < fxrBbLength - 1) return;

  const fxrBasis = fxrCalculateSMA(fxrBbSource, fxrBbLength);
  if (!Number.isFinite(fxrBasis)) return;

  const fxrStdDev = fxrCalculateStdDev(fxrBbSource, fxrBbLength, fxrBasis);
  if (!Number.isFinite(fxrStdDev)) return;

  const fxrUpperBand = fxrBasis + fxrStdDev * fxrBbMultiplier;
  const fxrLowerBand = fxrBasis - fxrStdDev * fxrBbMultiplier;

  if (![fxrUpperBand, fxrLowerBand].every(Number.isFinite)) return;

  plot.line('BB Basis', fxrBasis, fxrBbBasisColor, 0);
  plot.line('BB Upper', fxrUpperBand, fxrBbUpperColor, 0);
  plot.line('BB Lower', fxrLowerBand, fxrBbLowerColor, 0);
};
