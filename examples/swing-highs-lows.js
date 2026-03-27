//@version=1

const fxrHighHistory = [];
const fxrLowHistory = [];
const fxrTimeHistory = [];

let fxrLastBarTime = null;
let fxrLastSwingHighTime = null;
let fxrLastSwingLowTime = null;

const fxrPushCapped = (fxrArray, fxrValue, fxrMaxLength) => {
  fxrArray.push(fxrValue);
  if (fxrArray.length > fxrMaxLength) fxrArray.shift();
};

const fxrIsPivotHigh = (fxrHighs, fxrMidIndex, fxrSwingLength) => {
  const fxrPivotHigh = fxrHighs[fxrMidIndex];
  if (!Number.isFinite(fxrPivotHigh)) return false;

  for (let i = 1; i <= fxrSwingLength; i++) {
    const fxrLeftHigh = fxrHighs[fxrMidIndex - i];
    const fxrRightHigh = fxrHighs[fxrMidIndex + i];

    if (!Number.isFinite(fxrLeftHigh) || !Number.isFinite(fxrRightHigh)) {
      return false;
    }
    if (fxrPivotHigh < fxrLeftHigh || fxrPivotHigh <= fxrRightHigh) {
      return false;
    }
  }

  return true;
};

const fxrIsPivotLow = (fxrLows, fxrMidIndex, fxrSwingLength) => {
  const fxrPivotLow = fxrLows[fxrMidIndex];
  if (!Number.isFinite(fxrPivotLow)) return false;

  for (let i = 1; i <= fxrSwingLength; i++) {
    const fxrLeftLow = fxrLows[fxrMidIndex - i];
    const fxrRightLow = fxrLows[fxrMidIndex + i];

    if (!Number.isFinite(fxrLeftLow) || !Number.isFinite(fxrRightLow)) {
      return false;
    }
    if (fxrPivotLow > fxrLeftLow || fxrPivotLow >= fxrRightLow) {
      return false;
    }
  }

  return true;
};

init = () => {
  indicator({ onMainPanel: true, format: 'price' });

  input.int(
    'Swing Length',
    3,
    'swingLength',
    1,
    25,
    1,
    'Bars to the left and right required to confirm a pivot',
    'Calculation'
  );
  input.bool('Show Swing Highs', true, 'showSwingHighs', 'Display');
  input.bool('Show Swing Lows', true, 'showSwingLows', 'Display');

  input.color('Swing High Color', color.red, 'swingHighColor', 'Style');
  input.color('Swing Low Color', color.green, 'swingLowColor', 'Style');
};

onTick = (length, _moment, _, ta, inputs) => {
  const fxrSwingLength = inputs.swingLength;
  const fxrShowSwingHighs = inputs.showSwingHighs;
  const fxrShowSwingLows = inputs.showSwingLows;
  const fxrSwingHighColor = inputs.swingHighColor;
  const fxrSwingLowColor = inputs.swingLowColor;

  if (!Number.isFinite(fxrSwingLength) || fxrSwingLength < 1) return;

  const fxrCurrentBarTime = time(0);
  const fxrCurrentHigh = high(0);
  const fxrCurrentLow = low(0);

  if (!Number.isFinite(fxrCurrentBarTime)) return;
  if (!Number.isFinite(fxrCurrentHigh) || !Number.isFinite(fxrCurrentLow)) {
    return;
  }
  if (fxrLastBarTime === fxrCurrentBarTime) return;
  fxrLastBarTime = fxrCurrentBarTime;

  const fxrMaxLength = Math.max(fxrSwingLength * 6, 300);
  fxrPushCapped(fxrHighHistory, fxrCurrentHigh, fxrMaxLength);
  fxrPushCapped(fxrLowHistory, fxrCurrentLow, fxrMaxLength);
  fxrPushCapped(fxrTimeHistory, fxrCurrentBarTime, fxrMaxLength);

  const fxrRequiredBars = fxrSwingLength * 2 + 1;
  if (fxrHighHistory.length < fxrRequiredBars) return;

  const fxrMidIndex = fxrHighHistory.length - 1 - fxrSwingLength;
  const fxrPivotTime = fxrTimeHistory[fxrMidIndex];

  if (fxrShowSwingHighs && fxrIsPivotHigh(fxrHighHistory, fxrMidIndex, fxrSwingLength)) {
    const fxrPivotHigh = fxrHighHistory[fxrMidIndex];

    if (
      Number.isFinite(fxrPivotTime) &&
      Number.isFinite(fxrPivotHigh) &&
      fxrLastSwingHighTime !== fxrPivotTime
    ) {
      fxrLastSwingHighTime = fxrPivotTime;
      textPoint(fxrPivotTime, fxrPivotHigh, 'SH', {
        color: color.white,
        backgroundColor: fxrSwingHighColor,
        fontsize: 10,
        bold: true,
        fillBackground: true
      });
    }
  }

  if (fxrShowSwingLows && fxrIsPivotLow(fxrLowHistory, fxrMidIndex, fxrSwingLength)) {
    const fxrPivotLow = fxrLowHistory[fxrMidIndex];

    if (
      Number.isFinite(fxrPivotTime) &&
      Number.isFinite(fxrPivotLow) &&
      fxrLastSwingLowTime !== fxrPivotTime
    ) {
      fxrLastSwingLowTime = fxrPivotTime;
      textPoint(fxrPivotTime, fxrPivotLow, 'SL', {
        color: color.white,
        backgroundColor: fxrSwingLowColor,
        fontsize: 10,
        bold: true,
        fillBackground: true
      });
    }
  }
};
