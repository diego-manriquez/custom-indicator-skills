//@version=1

const fxrRsiSourceHistory = [];
const fxrRsiGainHistory = [];
const fxrRsiLossHistory = [];
const fxrRsiValueHistory = [];

let fxrLastBarTime = null;

const fxrPushCapped = (fxrArray, fxrValue, fxrMaxLength) => {
  fxrArray.push(fxrValue);
  if (fxrArray.length > fxrMaxLength) fxrArray.shift();
};

const fxrCalculateRsi = (fxrGains, fxrLosses, fxrPeriod, ta) => {
  if (fxrGains.length < fxrPeriod || fxrLosses.length < fxrPeriod) return NaN;

  const fxrAvgGains = ta.rma(fxrGains, fxrPeriod);
  const fxrAvgLosses = ta.rma(fxrLosses, fxrPeriod);

  const fxrAvgGain = fxrAvgGains[fxrAvgGains.length - 1];
  const fxrAvgLoss = fxrAvgLosses[fxrAvgLosses.length - 1];

  if (!Number.isFinite(fxrAvgGain) || !Number.isFinite(fxrAvgLoss)) return NaN;
  if (fxrAvgLoss === 0) return 100;

  const fxrRelativeStrength = fxrAvgGain / fxrAvgLoss;
  return 100 - 100 / (1 + fxrRelativeStrength);
};

init = () => {
  indicator({ onMainPanel: false, format: 'inherit' });

  input.src('RSI Source', 'close', 'source');
  input.int('RSI Length', 14, 'period', 1, 500, 1, 'Bars used to calculate RSI');
  input.bool('Directional Color', true, 'changeDirectionalColor');

  band.line('Overbought', 70, '#787B86', 2, 1, true);
  band.line('Middle', 50, '#787B86', 2, 1, true);
  band.line('Oversold', 30, '#787B86', 2, 1, true);
};

onTick = (length, _moment, _, ta, inputs) => {
  const fxrSource = inputs.source;
  const fxrPeriod = inputs.period;
  const fxrChangeDirectionalColor = inputs.changeDirectionalColor;

  if (typeof fxrSource !== 'function') return;
  if (!Number.isFinite(fxrPeriod) || fxrPeriod < 1) return;

  const fxrBarTime = time(0);
  if (!fxrBarTime) return;
  if (fxrLastBarTime === fxrBarTime) return;
  fxrLastBarTime = fxrBarTime;

  const fxrSourceValue = fxrSource(0);
  if (!Number.isFinite(fxrSourceValue)) return;

  const fxrMaxLength = Math.max(fxrPeriod * 5, 300);
  fxrPushCapped(fxrRsiSourceHistory, fxrSourceValue, fxrMaxLength);

  if (fxrRsiSourceHistory.length < 2) return;

  const fxrPreviousSourceValue =
    fxrRsiSourceHistory[fxrRsiSourceHistory.length - 2];
  const fxrDelta = fxrSourceValue - fxrPreviousSourceValue;

  fxrPushCapped(fxrRsiGainHistory, fxrDelta > 0 ? fxrDelta : 0, fxrMaxLength);
  fxrPushCapped(
    fxrRsiLossHistory,
    fxrDelta < 0 ? Math.abs(fxrDelta) : 0,
    fxrMaxLength
  );

  const fxrRsi = fxrCalculateRsi(
    fxrRsiGainHistory,
    fxrRsiLossHistory,
    fxrPeriod,
    ta
  );
  if (!Number.isFinite(fxrRsi)) return;

  fxrPushCapped(fxrRsiValueHistory, fxrRsi, fxrMaxLength);

  plot.line('RSI', fxrRsi, '#F59E0B', 0);

  let fxrRsiColorIndex = 2;
  if (fxrChangeDirectionalColor && fxrRsiValueHistory.length > 1) {
    const fxrPreviousRsi = fxrRsiValueHistory[fxrRsiValueHistory.length - 2];
    if (Number.isFinite(fxrPreviousRsi)) {
      fxrRsiColorIndex = fxrRsi > fxrPreviousRsi ? 0 : 1;
    }
  }

  plot.colorer('RSI Color', fxrRsiColorIndex, 'RSI', [
    { name: 'Rising', color: color.green },
    { name: 'Falling', color: color.red },
    { name: 'Neutral', color: color.blue }
  ]);
};
