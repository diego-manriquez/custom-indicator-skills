//@version=1

// Round Number Quarters Theory
// Draws horizontal lines at Major Large Quarter, Large Quarter, and Quarter
// round-number levels above and below the current price.

let fxrLines = [];
let fxrLastBarTime = null;
let fxrLastMLQBase = null;
let fxrLastLQBase = null;
let fxrLastQBase = null;
let fxrNeedsRedraw = false;

const fxrFormatLineStyle = (style) => {
  if (style === 'dotted') return 1;
  if (style === 'dashed') return 2;
  return 0;
};

const fxrTextSizeMap = {
  tiny: 8,
  small: 10,
  normal: 12,
  large: 14,
  huge: 16,
};

init = () => {
  indicator({ onMainPanel: true, format: 'inherit' });

  // --- Major Large Quarters ---
  input.bool('Major Large Quarters', true, 'fxrMLQEnable', 'Major Large Quarters');
  input.bool('Use Custom Value', false, 'fxrMLQUseCustom', 'Major Large Quarters', 'mlqCustom');
  input.str('', 'Pips', 'fxrMLQCustomMode', ['Pips', 'Price'], undefined, 'Major Large Quarters', 'mlqCustom');
  input.float('', 1000, 'fxrMLQCustomVal', 0, undefined, undefined, undefined, 'Major Large Quarters', 'mlqCustom');
  input.int('Lines above/below', 1, 'fxrMLQCount', 1, 4, 1, undefined, 'Major Large Quarters');
  input.color('Color', color.rgba(243, 213, 0, 1), 'fxrMLQColor', 'Major Large Quarters', 'mlqStyle');
  input.str('Style', 'solid', 'fxrMLQStyle', ['solid', 'dotted', 'dashed'], undefined, 'Major Large Quarters', 'mlqStyle');
  input.int('Width', 3, 'fxrMLQWidth', 1, 4, 1, undefined, 'Major Large Quarters', 'mlqStyle');
  input.bool('Show Label', true, 'fxrMLQShowLabel', 'Major Large Quarters', 'mlqLabel');
  input.str('Label Size', 'Large', 'fxrMLQLabelSize', ['Tiny', 'Small', 'Normal', 'Large', 'Huge'], undefined, 'Major Large Quarters', 'mlqLabel');

  // --- Large Quarters ---
  input.bool('Large Quarters', true, 'fxrLQEnable', 'Large Quarters');
  input.bool('Use Custom Value', false, 'fxrLQUseCustom', 'Large Quarters', 'lqCustom');
  input.str('', 'Pips', 'fxrLQCustomMode', ['Pips', 'Price'], undefined, 'Large Quarters', 'lqCustom');
  input.float('', 250, 'fxrLQCustomVal', 0, undefined, undefined, undefined, 'Large Quarters', 'lqCustom');
  input.int('Lines above/below', 1, 'fxrLQCount', 1, 4, 1, undefined, 'Large Quarters');
  input.color('Color', color.rgba(78, 151, 209, 1), 'fxrLQColor', 'Large Quarters', 'lqStyle');
  input.str('Style', 'solid', 'fxrLQStyle', ['solid', 'dotted', 'dashed'], undefined, 'Large Quarters', 'lqStyle');
  input.int('Width', 2, 'fxrLQWidth', 1, 4, 1, undefined, 'Large Quarters', 'lqStyle');
  input.bool('Show Label', true, 'fxrLQShowLabel', 'Large Quarters', 'lqLabel');
  input.str('Label Size', 'Normal', 'fxrLQLabelSize', ['Tiny', 'Small', 'Normal', 'Large', 'Huge'], undefined, 'Large Quarters', 'lqLabel');

  // --- Quarters ---
  input.bool('Quarters', true, 'fxrQEnable', 'Quarters');
  input.bool('Use Custom Value', false, 'fxrQUseCustom', 'Quarters', 'qCustom');
  input.str('', 'Pips', 'fxrQCustomMode', ['Pips', 'Price'], undefined, 'Quarters', 'qCustom');
  input.float('', 50, 'fxrQCustomVal', 0, undefined, undefined, undefined, 'Quarters', 'qCustom');
  input.int('Lines above/below', 1, 'fxrQCount', 1, 4, 1, undefined, 'Quarters');
  input.color('Color', color.rgba(188, 0, 70, 1), 'fxrQColor', 'Quarters', 'qStyle');
  input.str('Style', 'solid', 'fxrQStyle', ['solid', 'dotted', 'dashed'], undefined, 'Quarters', 'qStyle');
  input.int('Width', 1, 'fxrQWidth', 1, 4, 1, undefined, 'Quarters', 'qStyle');
  input.bool('Show Label', true, 'fxrQShowLabel', 'Quarters', 'qLabel');
  input.str('Label Size', 'Small', 'fxrQLabelSize', ['Tiny', 'Small', 'Normal', 'Large', 'Huge'], undefined, 'Quarters', 'qLabel');
};

onTick = (length, _moment, _, ta, inputs) => {
  if (!isLastProcessedBar()) return;

  const t0 = time(0);
  if (!Number.isFinite(t0)) return;

  // Only check once per bar
  if (t0 === fxrLastBarTime) return;
  fxrLastBarTime = t0;

  const currentClose = closeC(0);
  if (!Number.isFinite(currentClose) || currentClose <= 0) return;

  const minTick = getMinTick();
  if (!Number.isFinite(minTick) || minTick <= 0) return;

  const assetType = getAssetType();

  let pipValue = minTick;
  if (assetType !== 'futures' && assetType !== 'crypto') {
    pipValue = minTick;
  }

  const fxrCalcStep = (useCustom, customMode, customVal, defaultPips) => {
    if (useCustom && customMode === 'Price') return 0;
    const pips = (useCustom && customMode === 'Pips') ? customVal : defaultPips;
    return pipValue * pips;
  };

  const mlqStep = fxrCalcStep(inputs.fxrMLQUseCustom, inputs.fxrMLQCustomMode, inputs.fxrMLQCustomVal, 1000);
  const lqStep = fxrCalcStep(inputs.fxrLQUseCustom, inputs.fxrLQCustomMode, inputs.fxrLQCustomVal, 250);
  const qStep = fxrCalcStep(inputs.fxrQUseCustom, inputs.fxrQCustomMode, inputs.fxrQCustomVal, 50);

  // Compute base prices — only redraw when a base changes
  const mlqBase = mlqStep > 0 ? Math.floor(currentClose / mlqStep) : -1;
  const lqBase = lqStep > 0 ? Math.floor(currentClose / lqStep) : -1;
  const qBase = qStep > 0 ? Math.floor(currentClose / qStep) : -1;

  fxrNeedsRedraw = (mlqBase !== fxrLastMLQBase || lqBase !== fxrLastLQBase || qBase !== fxrLastQBase);
  if (!fxrNeedsRedraw) return;

  fxrLastMLQBase = mlqBase;
  fxrLastLQBase = lqBase;
  fxrLastQBase = qBase;

  // Clean up previous lines
  for (let i = 0; i < fxrLines.length; i++) {
    deleteDrawingById(fxrLines[i]);
  }
  fxrLines = [];

  // Track drawn prices to avoid overlap
  const drawnPrices = [];

  const fxrDrawLevel = (price, lineColor, lineStyle, lineWidth, showLabel, labelSize, labelText) => {
    // Skip if already drawn at this price
    for (let j = 0; j < drawnPrices.length; j++) {
      if (Math.abs(drawnPrices[j] - price) < minTick * 0.5) return;
    }
    drawnPrices.push(price);

    const id = horizontalLine(price, {
      linecolor: lineColor,
      linewidth: lineWidth,
      linestyle: fxrFormatLineStyle(lineStyle),
      showLabel: showLabel,
      textcolor: lineColor,
      fontsize: fxrTextSizeMap[labelSize.toLowerCase()] || 12,
      horzLabelsAlign: 'right',
      showPrice: true,
    });
    if (id) fxrLines.push(id);
  };

  const fxrDrawLevels = (step, count, isEnabled, lineColor, lineStyle, lineWidth, showLabel, labelSize, labelText) => {
    if (!isEnabled || step <= 0) return;
    for (let i = 0; i < count; i++) {
      // Step up
      let stepUp = Math.ceil(currentClose / step) * step + i * step;
      while (drawnPrices.indexOf(stepUp) !== -1) {
        stepUp = stepUp + step;
      }
      fxrDrawLevel(stepUp, lineColor, lineStyle, lineWidth, showLabel, labelSize, labelText);

      // Step down
      let stepDown = Math.floor(currentClose / step) * step - i * step;
      while (drawnPrices.indexOf(stepDown) !== -1) {
        stepDown = stepDown - step;
      }
      fxrDrawLevel(stepDown, lineColor, lineStyle, lineWidth, showLabel, labelSize, labelText);
    }
  };

  // --- Major Large Quarters ---
  if (!inputs.fxrMLQUseCustom || inputs.fxrMLQCustomMode === 'Pips') {
    fxrDrawLevels(
      mlqStep, inputs.fxrMLQCount, inputs.fxrMLQEnable,
      inputs.fxrMLQColor, inputs.fxrMLQStyle, inputs.fxrMLQWidth,
      inputs.fxrMLQShowLabel, inputs.fxrMLQLabelSize, 'Major Large Quarters'
    );
  }
  if (inputs.fxrMLQUseCustom && inputs.fxrMLQCustomMode === 'Price') {
    fxrDrawLevel(
      inputs.fxrMLQCustomVal,
      inputs.fxrMLQColor, inputs.fxrMLQStyle, inputs.fxrMLQWidth,
      inputs.fxrMLQShowLabel, inputs.fxrMLQLabelSize, 'Major Large Quarters'
    );
  }

  // --- Large Quarters ---
  if (!inputs.fxrLQUseCustom || inputs.fxrLQCustomMode === 'Pips') {
    fxrDrawLevels(
      lqStep, inputs.fxrLQCount, inputs.fxrLQEnable,
      inputs.fxrLQColor, inputs.fxrLQStyle, inputs.fxrLQWidth,
      inputs.fxrLQShowLabel, inputs.fxrLQLabelSize, 'Large Quarters'
    );
  }
  if (inputs.fxrLQUseCustom && inputs.fxrLQCustomMode === 'Price') {
    fxrDrawLevel(
      inputs.fxrLQCustomVal,
      inputs.fxrLQColor, inputs.fxrLQStyle, inputs.fxrLQWidth,
      inputs.fxrLQShowLabel, inputs.fxrLQLabelSize, 'Large Quarters'
    );
  }

  // --- Quarters ---
  if (!inputs.fxrQUseCustom || inputs.fxrQCustomMode === 'Pips') {
    fxrDrawLevels(
      qStep, inputs.fxrQCount, inputs.fxrQEnable,
      inputs.fxrQColor, inputs.fxrQStyle, inputs.fxrQWidth,
      inputs.fxrQShowLabel, inputs.fxrQLabelSize, 'Quarters'
    );
  }
  if (inputs.fxrQUseCustom && inputs.fxrQCustomMode === 'Price') {
    fxrDrawLevel(
      inputs.fxrQCustomVal,
      inputs.fxrQColor, inputs.fxrQStyle, inputs.fxrQWidth,
      inputs.fxrQShowLabel, inputs.fxrQLabelSize, 'Quarters'
    );
  }
};
