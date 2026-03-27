//@version=1

const fxrMentfxTimeBars = [];
const fxrMentfxOpenBars = [];
const fxrMentfxHighBars = [];
const fxrMentfxLowBars = [];
const fxrMentfxCloseBars = [];

const fxrToUnixSeconds = (fxrBarTime) => {
  if (!Number.isFinite(fxrBarTime)) return NaN;
  return fxrBarTime > 1000000000000
    ? Math.floor(fxrBarTime / 1000)
    : fxrBarTime;
};

const fxrUpsertBar = (
  fxrTimeBars,
  fxrOpenBars,
  fxrHighBars,
  fxrLowBars,
  fxrCloseBars,
  fxrBarTime,
  fxrBarOpen,
  fxrBarHigh,
  fxrBarLow,
  fxrBarClose,
) => {
  const fxrLastIndex = fxrTimeBars.length - 1;
  if (fxrLastIndex >= 0 && fxrTimeBars[fxrLastIndex] === fxrBarTime) {
    fxrOpenBars[fxrLastIndex] = fxrBarOpen;
    fxrHighBars[fxrLastIndex] = fxrBarHigh;
    fxrLowBars[fxrLastIndex] = fxrBarLow;
    fxrCloseBars[fxrLastIndex] = fxrBarClose;
    return;
  }

  fxrTimeBars.push(fxrBarTime);
  fxrOpenBars.push(fxrBarOpen);
  fxrHighBars.push(fxrBarHigh);
  fxrLowBars.push(fxrBarLow);
  fxrCloseBars.push(fxrBarClose);
};

const fxrTrimBars = (
  fxrTimeBars,
  fxrOpenBars,
  fxrHighBars,
  fxrLowBars,
  fxrCloseBars,
  fxrMaxDays,
) => {
  if (fxrMaxDays <= 0 || fxrTimeBars.length < 10) return;

  const fxrLatestTime = fxrTimeBars[fxrTimeBars.length - 1];
  const fxrMaxAgeSeconds = fxrMaxDays * 24 * 60 * 60;

  while (
    fxrTimeBars.length > 10 &&
    fxrLatestTime - fxrTimeBars[0] > fxrMaxAgeSeconds * 2
  ) {
    fxrTimeBars.shift();
    fxrOpenBars.shift();
    fxrHighBars.shift();
    fxrLowBars.shift();
    fxrCloseBars.shift();
  }
};

const fxrGetCandleByIndex = (
  fxrIndex,
  fxrTimeBars,
  fxrOpenBars,
  fxrHighBars,
  fxrLowBars,
  fxrCloseBars,
) => ({
  candleTime: fxrTimeBars[fxrIndex],
  candleOpen: fxrOpenBars[fxrIndex],
  candleHigh: fxrHighBars[fxrIndex],
  candleLow: fxrLowBars[fxrIndex],
  candleClose: fxrCloseBars[fxrIndex],
});

const fxrIsCandleBodyHigher = (fxrCandle, fxrHighLevel) =>
  fxrCandle.candleOpen >= fxrHighLevel || fxrCandle.candleClose >= fxrHighLevel;

const fxrIsCandleBodyLower = (fxrCandle, fxrLowLevel) =>
  fxrCandle.candleOpen <= fxrLowLevel || fxrCandle.candleClose <= fxrLowLevel;

const fxrComputeMentfxLevels = (
  fxrTimeBars,
  fxrOpenBars,
  fxrHighBars,
  fxrLowBars,
  fxrCloseBars,
  fxrMaxDays,
) => {
  const fxrLength = fxrTimeBars.length;
  if (fxrLength < 5) {
    return { upperValue: NaN, lowerValue: NaN };
  }

  const fxrInitialHigh = 0;
  const fxrInitialLow = 99999;
  const fxrLastCandleTime = fxrTimeBars[fxrLength - 1];
  const fxrMaxAgeSeconds = fxrMaxDays * 24 * 60 * 60;

  const fxrAllHighs = [];
  const fxrAllLows = [];

  let fxrIsCurrentCandleSwingHigh = false;
  let fxrIsCurrentCandleSwingLow = false;
  let fxrSwingHighRange;
  let fxrSwingLowRange;
  let fxrNewHigh = fxrInitialHigh;
  let fxrNewLow = fxrInitialLow;
  let fxrIsBullish = true;
  let fxrLastHigh;
  let fxrLastLow;
  let fxrTempLow;
  let fxrTempHigh;
  let fxrBreakIndex = false;
  let fxrLowerLow;
  let fxrHigherHigh;

  for (let i = 3; i < fxrLength - 1; i++) {
    if (
      fxrMaxDays > 0 &&
      fxrLastCandleTime - fxrTimeBars[i] > fxrMaxAgeSeconds
    ) {
      continue;
    }

    const fxrCurrentCandle = fxrGetCandleByIndex(
      i,
      fxrTimeBars,
      fxrOpenBars,
      fxrHighBars,
      fxrLowBars,
      fxrCloseBars,
    );
    const fxrLeftData = fxrGetCandleByIndex(
      i - 1,
      fxrTimeBars,
      fxrOpenBars,
      fxrHighBars,
      fxrLowBars,
      fxrCloseBars,
    );
    const fxrTwoLeftData = fxrGetCandleByIndex(
      i - 2,
      fxrTimeBars,
      fxrOpenBars,
      fxrHighBars,
      fxrLowBars,
      fxrCloseBars,
    );
    const fxrRightData = fxrGetCandleByIndex(
      i + 1,
      fxrTimeBars,
      fxrOpenBars,
      fxrHighBars,
      fxrLowBars,
      fxrCloseBars,
    );

    if (
      fxrCurrentCandle.candleHigh > fxrLeftData.candleHigh &&
      fxrCurrentCandle.candleHigh > fxrRightData.candleHigh &&
      fxrCurrentCandle.candleHigh > fxrLastHigh
    ) {
      fxrIsCurrentCandleSwingHigh = true;
    } else {
      fxrIsCurrentCandleSwingHigh = false;
    }

    if (
      fxrCurrentCandle.candleLow < fxrLeftData.candleLow &&
      fxrCurrentCandle.candleLow < fxrRightData.candleLow &&
      fxrCurrentCandle.candleLow < fxrLastLow
    ) {
      fxrIsCurrentCandleSwingLow = true;
    } else {
      fxrIsCurrentCandleSwingLow = false;
    }

    if (fxrBreakIndex) {
      fxrBreakIndex = false;
      let fxrAuxLow;
      let fxrAuxHigh;

      if (
        fxrTwoLeftData.candleLow > fxrLeftData.candleOpen ||
        fxrTwoLeftData.candleLow > fxrLeftData.candleClose
      ) {
        fxrAuxLow = fxrLeftData.candleLow;
      }
      if (
        fxrLeftData.candleLow > fxrCurrentCandle.candleOpen ||
        fxrLeftData.candleLow > fxrCurrentCandle.candleClose
      ) {
        fxrAuxLow = fxrLeftData.candleLow;
      }
      fxrLowerLow = fxrAuxLow;

      if (
        fxrTwoLeftData.candleHigh < fxrLeftData.candleOpen ||
        fxrTwoLeftData.candleHigh < fxrLeftData.candleClose
      ) {
        fxrAuxHigh = fxrLeftData.candleHigh;
      }
      if (
        fxrLeftData.candleHigh < fxrCurrentCandle.candleOpen ||
        fxrLeftData.candleHigh < fxrCurrentCandle.candleClose
      ) {
        fxrAuxHigh = fxrCurrentCandle.candleHigh;
      }
      fxrHigherHigh = fxrAuxHigh;
    } else {
      if (
        fxrCurrentCandle.candleOpen < fxrLeftData.candleLow ||
        fxrCurrentCandle.candleClose < fxrLeftData.candleLow
      ) {
        fxrLowerLow = fxrCurrentCandle.candleLow;
      } else if (fxrCurrentCandle.candleLow < fxrLowerLow) {
        fxrLowerLow = fxrCurrentCandle.candleLow;
      }

      if (
        fxrCurrentCandle.candleOpen > fxrLeftData.candleHigh ||
        fxrCurrentCandle.candleClose > fxrLeftData.candleHigh
      ) {
        fxrHigherHigh = fxrCurrentCandle.candleHigh;
      } else if (fxrCurrentCandle.candleHigh > fxrHigherHigh) {
        fxrHigherHigh = fxrCurrentCandle.candleHigh;
      }
    }

    if (fxrIsBullish) {
      if (fxrIsCandleBodyHigher(fxrCurrentCandle, fxrNewHigh)) {
        fxrIsBullish = true;
        fxrNewHigh = fxrCurrentCandle.candleHigh;
        if (fxrIsCurrentCandleSwingHigh) {
          fxrSwingHighRange = true;
        } else {
          fxrSwingHighRange = false;
        }
        fxrTempLow = fxrLowerLow;
        if (fxrTempLow) {
          fxrNewLow = fxrTempLow;
        }
        fxrBreakIndex = true;
      } else if (fxrIsCandleBodyLower(fxrCurrentCandle, fxrNewLow)) {
        fxrIsBullish = false;
        fxrNewLow = fxrCurrentCandle.candleLow;
        fxrSwingHighRange = false;
        if (fxrIsCurrentCandleSwingLow) {
          fxrSwingLowRange = true;
        } else {
          fxrSwingLowRange = false;
        }
        fxrTempHigh = fxrHigherHigh;
        if (fxrTempHigh) {
          fxrNewHigh = fxrTempHigh;
        }
        fxrBreakIndex = true;
      }

      if (!fxrSwingHighRange) {
        if (fxrIsCurrentCandleSwingHigh) {
          fxrNewHigh = fxrCurrentCandle.candleHigh;
          fxrSwingHighRange = true;
        } else if (fxrCurrentCandle.candleHigh > fxrNewHigh) {
          fxrNewHigh = fxrCurrentCandle.candleHigh;
          fxrBreakIndex = true;
        }
      }
    } else {
      if (fxrIsCandleBodyLower(fxrCurrentCandle, fxrNewLow)) {
        fxrIsBullish = false;
        fxrNewLow = fxrCurrentCandle.candleLow;
        if (fxrIsCurrentCandleSwingLow) {
          fxrSwingLowRange = true;
        } else {
          fxrSwingLowRange = false;
        }
        fxrTempHigh = fxrHigherHigh;
        if (fxrTempHigh) {
          fxrNewHigh = fxrTempHigh;
        }
        fxrBreakIndex = true;
      } else if (fxrIsCandleBodyHigher(fxrCurrentCandle, fxrNewHigh)) {
        fxrIsBullish = true;
        fxrNewHigh = fxrCurrentCandle.candleHigh;
        fxrSwingLowRange = false;
        if (fxrIsCurrentCandleSwingHigh) {
          fxrSwingHighRange = true;
        } else {
          fxrSwingHighRange = false;
        }
        fxrTempLow = fxrLowerLow;
        if (fxrTempLow) {
          fxrNewLow = fxrTempLow;
        }
        fxrBreakIndex = true;
      }

      if (!fxrSwingLowRange) {
        if (fxrIsCurrentCandleSwingLow) {
          fxrNewLow = fxrCurrentCandle.candleLow;
          fxrSwingLowRange = true;
        } else if (fxrCurrentCandle.candleLow < fxrNewLow) {
          fxrNewLow = fxrCurrentCandle.candleLow;
          fxrBreakIndex = true;
        }
      }
    }

    if (fxrLastHigh !== fxrNewHigh && fxrNewHigh !== fxrInitialHigh) {
      fxrAllHighs.push(fxrNewHigh);
    }

    if (fxrLastLow !== fxrNewLow && fxrNewLow !== fxrInitialLow) {
      fxrAllLows.push(fxrNewLow);
    }

    fxrLastHigh = fxrNewHigh;
    fxrLastLow = fxrNewLow;
  }

  let fxrUpperValue = NaN;
  let fxrLowerValue = NaN;

  if (fxrAllHighs.length >= 2) {
    const fxrLastHighValue = fxrAllHighs[fxrAllHighs.length - 1];
    if (Number.isFinite(fxrLastHighValue)) {
      fxrUpperValue = fxrLastHighValue;
    }
  }

  if (fxrAllLows.length >= 2) {
    const fxrLastLowValue = fxrAllLows[fxrAllLows.length - 1];
    if (Number.isFinite(fxrLastLowValue)) {
      fxrLowerValue = fxrLastLowValue;
    }
  }

  return {
    upperValue: fxrUpperValue,
    lowerValue: fxrLowerValue,
  };
};

init = () => {
  indicator({ onMainPanel: true, format: "price" });

  input.int(
    "Max Days",
    30,
    "maxDays",
    0,
    365,
    1,
    "Max days to render. Use 0 to keep all processed bars.",
    "Calculation",
  );
};

onTick = (length, _moment, _, ta, inputs) => {
  const fxrMaxDays = inputs.maxDays;
  if (!Number.isFinite(fxrMaxDays) || fxrMaxDays < 0) return;

  const fxrCurrentBarTime = fxrToUnixSeconds(time(0));
  const fxrCurrentOpen = openC(0);
  const fxrCurrentHigh = high(0);
  const fxrCurrentLow = low(0);
  const fxrCurrentClose = closeC(0);

  if (
    !Number.isFinite(fxrCurrentBarTime) ||
    !Number.isFinite(fxrCurrentOpen) ||
    !Number.isFinite(fxrCurrentHigh) ||
    !Number.isFinite(fxrCurrentLow) ||
    !Number.isFinite(fxrCurrentClose)
  ) {
    return;
  }

  fxrUpsertBar(
    fxrMentfxTimeBars,
    fxrMentfxOpenBars,
    fxrMentfxHighBars,
    fxrMentfxLowBars,
    fxrMentfxCloseBars,
    fxrCurrentBarTime,
    fxrCurrentOpen,
    fxrCurrentHigh,
    fxrCurrentLow,
    fxrCurrentClose,
  );

  fxrTrimBars(
    fxrMentfxTimeBars,
    fxrMentfxOpenBars,
    fxrMentfxHighBars,
    fxrMentfxLowBars,
    fxrMentfxCloseBars,
    fxrMaxDays,
  );

  const fxrMentfx = fxrComputeMentfxLevels(
    fxrMentfxTimeBars,
    fxrMentfxOpenBars,
    fxrMentfxHighBars,
    fxrMentfxLowBars,
    fxrMentfxCloseBars,
    fxrMaxDays,
  );

  plot.line(
    "MentFX High",
    fxrMentfx.upperValue,
    "rgba(37, 150, 190, 1)",
    9,
    0,
    undefined,
    undefined,
    true,
    2,
  );
  plot.line(
    "MentFX Low",
    fxrMentfx.lowerValue,
    "rgba(37, 150, 190, 1)",
    9,
    0,
    undefined,
    undefined,
    true,
    2,
  );
};
