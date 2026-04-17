//@version=1

// Round Number by FX Replay
// Draws horizontal lines at Round 00, Round 50, and Quarter levels
// above and below the current price.

let fxrLines = [];
let fxrLastBarTime = null;
let fxrLast00Base = null;
let fxrLast50Base = null;
let fxrLastQBase = null;

const fxrFormatLineStyle = (style) => {
  if (style === 'dotted') return 1;
  if (style === 'dashed') return 2;
  return 0;
};

init = () => {
  indicator({ onMainPanel: true, format: 'inherit' });

  // --- Round 00 Numbers ---
  input.bool('Round 00 Enable', true, 'fxr00Enable', 'Round 00 Numbers');
  input.color('Round 00 Color', color.rgba(243, 213, 0, 1), 'fxr00Color', 'Round 00 Numbers', 'r00Style');
  input.str('Round 00 Style', 'solid', 'fxr00Style', ['solid', 'dotted', 'dashed'], undefined, 'Round 00 Numbers', 'r00Style');
  input.int('Round 00 Width', 3, 'fxr00Width', 1, 4, 1, undefined, 'Round 00 Numbers', 'r00Style');

  // --- Round 50 Numbers ---
  input.bool('Round 50 Enable', true, 'fxr50Enable', 'Round 50 Numbers');
  input.color('Round 50 Color', color.rgba(78, 151, 209, 1), 'fxr50Color', 'Round 50 Numbers', 'r50Style');
  input.str('Round 50 Style', 'solid', 'fxr50Style', ['solid', 'dotted', 'dashed'], undefined, 'Round 50 Numbers', 'r50Style');
  input.int('Round 50 Width', 2, 'fxr50Width', 1, 4, 1, undefined, 'Round 50 Numbers', 'r50Style');

  // --- Round Quarters Numbers ---
  input.bool('Round Quarters Enable', true, 'fxrQEnable', 'Round Quarters Numbers');
  input.color('Round Quarters Color', color.rgba(188, 0, 70, 1), 'fxrQColor', 'Round Quarters Numbers', 'rqStyle');
  input.str('Round Quarters Style', 'solid', 'fxrQStyle', ['solid', 'dotted', 'dashed'], undefined, 'Round Quarters Numbers', 'rqStyle');
  input.int('Round Quarters Width', 1, 'fxrQWidth', 1, 4, 1, undefined, 'Round Quarters Numbers', 'rqStyle');

  // --- General ---
  input.int('Number of Each Line above/below', 1, 'fxrNumLines', 1, 4, 1);
};

onTick = (length, _moment, _, ta, inputs) => {
  if (!isLastProcessedBar) return;

  const t0 = time(0);
  if (!Number.isFinite(t0)) return;

  if (t0 === fxrLastBarTime) return;
  fxrLastBarTime = t0;

  const currentClose = closeC(0);
  if (!Number.isFinite(currentClose) || currentClose <= 0) return;

  const minTick = getMinTick();
  if (!Number.isFinite(minTick) || minTick <= 0) return;

  const fullStep = minTick * 1000;
  const halfStep = minTick * 500;
  const quarterStep = minTick * 250;

  // Only redraw when price crosses a level boundary
  const r00Base = Math.floor(currentClose / fullStep);
  const r50Base = Math.floor(currentClose / halfStep);
  const rqBase = Math.floor(currentClose / quarterStep);

  if (r00Base === fxrLast00Base && r50Base === fxrLast50Base && rqBase === fxrLastQBase) return;
  fxrLast00Base = r00Base;
  fxrLast50Base = r50Base;
  fxrLastQBase = rqBase;

  // Clean up previous lines
  for (let i = 0; i < fxrLines.length; i++) {
    deleteDrawingById(fxrLines[i]);
  }
  fxrLines = [];

  const drawnPrices = [];
  const numLines = inputs.fxrNumLines;

  const fxrDrawLevel = (price, lineColor, lineStyle, lineWidth) => {
    for (let j = 0; j < drawnPrices.length; j++) {
      if (Math.abs(drawnPrices[j] - price) < minTick * 0.5) return;
    }
    drawnPrices.push(price);

    const id = horizontalLine(price, {
      linecolor: lineColor,
      linewidth: lineWidth,
      linestyle: fxrFormatLineStyle(lineStyle),
      showPrice: false,
    });
    if (id) fxrLines.push(id);
  };

  const fxrDrawLevels = (step, isEnabled, lineColor, lineStyle, lineWidth) => {
    if (!isEnabled || step <= 0) return;
    for (let i = 0; i < numLines; i++) {
      let stepUp = Math.ceil(currentClose / step) * step + i * step;
      while (drawnPrices.indexOf(stepUp) !== -1) {
        stepUp = stepUp + step;
      }
      fxrDrawLevel(stepUp, lineColor, lineStyle, lineWidth);

      let stepDown = Math.floor(currentClose / step) * step - i * step;
      while (drawnPrices.indexOf(stepDown) !== -1) {
        stepDown = stepDown - step;
      }
      fxrDrawLevel(stepDown, lineColor, lineStyle, lineWidth);
    }
  };

  // Draw in order: 00 first, then 50, then quarters (so overlaps are skipped correctly)
  fxrDrawLevels(fullStep, inputs.fxr00Enable, inputs.fxr00Color, inputs.fxr00Style, inputs.fxr00Width);
  fxrDrawLevels(halfStep, inputs.fxr50Enable, inputs.fxr50Color, inputs.fxr50Style, inputs.fxr50Width);
  fxrDrawLevels(quarterStep, inputs.fxrQEnable, inputs.fxrQColor, inputs.fxrQStyle, inputs.fxrQWidth);
};
