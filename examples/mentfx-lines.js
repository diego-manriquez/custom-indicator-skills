//@version=1

let fxrMentfxInitialized = false;
let fxrMentfxLatestTimeSec = NaN;

let fxrMentfxUpperLevel = 0;
let fxrMentfxLowerLevel = 99999;
let fxrMentfxIsBullish = true;
let fxrMentfxLastUpperLevel = NaN;
let fxrMentfxLastLowerLevel = NaN;
let fxrMentfxBreakIndex = false;
let fxrMentfxLowerLow = NaN;
let fxrMentfxHigherHigh = NaN;
let fxrMentfxSwingHighRange = false;
let fxrMentfxSwingLowRange = false;

const fxrInitialUpperLevel = 0;
const fxrInitialLowerLevel = 99999;

const fxrToUnixSeconds = (fxrBarTime) => {
  if (!Number.isFinite(fxrBarTime)) return NaN;
  return fxrBarTime > 1000000000000
    ? Math.floor(fxrBarTime / 1000)
    : fxrBarTime;
};

const fxrIsBodyHigher = (fxrBarOpen, fxrBarClose, fxrLevel) =>
  fxrBarOpen >= fxrLevel || fxrBarClose >= fxrLevel;

const fxrIsBodyLower = (fxrBarOpen, fxrBarClose, fxrLevel) =>
  fxrBarOpen <= fxrLevel || fxrBarClose <= fxrLevel;

init = () => {
  indicator({ onMainPanel: true, format: 'price' });

  input.int(
    'Max Days',
    30,
    'maxDays',
    0,
    365,
    1,
    'Max days to render. Use 0 to keep all processed bars.',
    'Calculation'
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

  const fxrLeftOpen = openC(1);
  const fxrLeftHigh = high(1);
  const fxrLeftLow = low(1);
  const fxrLeftClose = closeC(1);

  const fxrTwoLeftOpen = openC(2);
  const fxrTwoLeftHigh = high(2);
  const fxrTwoLeftLow = low(2);
  const fxrTwoLeftClose = closeC(2);

  if (!Number.isFinite(fxrCurrentBarTime)) return;
  if (
    ![
      fxrCurrentOpen,
      fxrCurrentHigh,
      fxrCurrentLow,
      fxrCurrentClose,
      fxrLeftOpen,
      fxrLeftHigh,
      fxrLeftLow,
      fxrLeftClose,
      fxrTwoLeftOpen,
      fxrTwoLeftHigh,
      fxrTwoLeftLow,
      fxrTwoLeftClose
    ].every(Number.isFinite)
  ) {
    return;
  }

  if (!fxrMentfxInitialized) {
    fxrMentfxInitialized = true;
    fxrMentfxUpperLevel = fxrInitialUpperLevel;
    fxrMentfxLowerLevel = fxrInitialLowerLevel;
    fxrMentfxIsBullish = true;
    fxrMentfxLastUpperLevel = NaN;
    fxrMentfxLastLowerLevel = NaN;
    fxrMentfxBreakIndex = false;
    fxrMentfxLowerLow = fxrCurrentLow;
    fxrMentfxHigherHigh = fxrCurrentHigh;
    fxrMentfxSwingHighRange = false;
    fxrMentfxSwingLowRange = false;
    fxrMentfxLatestTimeSec = fxrCurrentBarTime;
  }

  const fxrPrevLastUpper = Number.isFinite(fxrMentfxLastUpperLevel)
    ? fxrMentfxLastUpperLevel
    : Number.NEGATIVE_INFINITY;
  const fxrPrevLastLower = Number.isFinite(fxrMentfxLastLowerLevel)
    ? fxrMentfxLastLowerLevel
    : Number.POSITIVE_INFINITY;

  const fxrIsPrevSwingHigh =
    fxrLeftHigh > fxrTwoLeftHigh &&
    fxrLeftHigh > fxrCurrentHigh &&
    fxrLeftHigh > fxrPrevLastUpper;
  const fxrIsPrevSwingLow =
    fxrLeftLow < fxrTwoLeftLow &&
    fxrLeftLow < fxrCurrentLow &&
    fxrLeftLow < fxrPrevLastLower;

  if (fxrMentfxBreakIndex) {
    fxrMentfxBreakIndex = false;

    let fxrAuxLow = fxrMentfxLowerLow;
    let fxrAuxHigh = fxrMentfxHigherHigh;

    if (fxrTwoLeftLow > fxrLeftOpen || fxrTwoLeftLow > fxrLeftClose) {
      fxrAuxLow = fxrLeftLow;
    }
    if (fxrLeftLow > fxrCurrentOpen || fxrLeftLow > fxrCurrentClose) {
      fxrAuxLow = fxrLeftLow;
    }

    if (fxrTwoLeftHigh < fxrLeftOpen || fxrTwoLeftHigh < fxrLeftClose) {
      fxrAuxHigh = fxrLeftHigh;
    }
    if (fxrLeftHigh < fxrCurrentOpen || fxrLeftHigh < fxrCurrentClose) {
      fxrAuxHigh = fxrCurrentHigh;
    }

    fxrMentfxLowerLow = fxrAuxLow;
    fxrMentfxHigherHigh = fxrAuxHigh;
  } else {
    if (fxrCurrentOpen < fxrLeftLow || fxrCurrentClose < fxrLeftLow) {
      fxrMentfxLowerLow = fxrCurrentLow;
    } else if (
      Number.isFinite(fxrMentfxLowerLow) &&
      fxrCurrentLow < fxrMentfxLowerLow
    ) {
      fxrMentfxLowerLow = fxrCurrentLow;
    }

    if (fxrCurrentOpen > fxrLeftHigh || fxrCurrentClose > fxrLeftHigh) {
      fxrMentfxHigherHigh = fxrCurrentHigh;
    } else if (
      Number.isFinite(fxrMentfxHigherHigh) &&
      fxrCurrentHigh > fxrMentfxHigherHigh
    ) {
      fxrMentfxHigherHigh = fxrCurrentHigh;
    }
  }

  const fxrCandleBodyHigher = fxrIsBodyHigher(
    fxrCurrentOpen,
    fxrCurrentClose,
    fxrMentfxUpperLevel
  );
  const fxrCandleBodyLower = fxrIsBodyLower(
    fxrCurrentOpen,
    fxrCurrentClose,
    fxrMentfxLowerLevel
  );

  if (fxrMentfxIsBullish) {
    if (fxrCandleBodyHigher) {
      fxrMentfxIsBullish = true;
      fxrMentfxUpperLevel = fxrCurrentHigh;
      fxrMentfxSwingHighRange = fxrIsPrevSwingHigh;
      if (Number.isFinite(fxrMentfxLowerLow)) {
        fxrMentfxLowerLevel = fxrMentfxLowerLow;
      }
      fxrMentfxBreakIndex = true;
    } else if (fxrCandleBodyLower) {
      fxrMentfxIsBullish = false;
      fxrMentfxLowerLevel = fxrCurrentLow;
      fxrMentfxSwingHighRange = false;
      fxrMentfxSwingLowRange = fxrIsPrevSwingLow;
      if (Number.isFinite(fxrMentfxHigherHigh)) {
        fxrMentfxUpperLevel = fxrMentfxHigherHigh;
      }
      fxrMentfxBreakIndex = true;
    }

    if (!fxrMentfxSwingHighRange) {
      if (fxrIsPrevSwingHigh) {
        fxrMentfxUpperLevel = fxrLeftHigh;
        fxrMentfxSwingHighRange = true;
      } else if (fxrCurrentHigh > fxrMentfxUpperLevel) {
        fxrMentfxUpperLevel = fxrCurrentHigh;
        fxrMentfxBreakIndex = true;
      }
    }

    if (!fxrMentfxSwingLowRange) {
      if (fxrIsPrevSwingLow) {
        fxrMentfxLowerLevel = fxrLeftLow;
        fxrMentfxSwingLowRange = true;
      } else if (fxrCurrentLow < fxrMentfxLowerLevel) {
        fxrMentfxLowerLevel = fxrCurrentLow;
        fxrMentfxBreakIndex = true;
      }
    }
  } else {
    if (fxrCandleBodyLower) {
      fxrMentfxIsBullish = false;
      fxrMentfxLowerLevel = fxrCurrentLow;
      fxrMentfxSwingLowRange = fxrIsPrevSwingLow;
      if (Number.isFinite(fxrMentfxHigherHigh)) {
        fxrMentfxUpperLevel = fxrMentfxHigherHigh;
      }
      fxrMentfxBreakIndex = true;
    } else if (fxrCandleBodyHigher) {
      fxrMentfxIsBullish = true;
      fxrMentfxUpperLevel = fxrCurrentHigh;
      fxrMentfxSwingLowRange = false;
      fxrMentfxSwingHighRange = fxrIsPrevSwingHigh;
      if (Number.isFinite(fxrMentfxLowerLow)) {
        fxrMentfxLowerLevel = fxrMentfxLowerLow;
      }
      fxrMentfxBreakIndex = true;
    }

    if (!fxrMentfxSwingLowRange) {
      if (fxrIsPrevSwingLow) {
        fxrMentfxLowerLevel = fxrLeftLow;
        fxrMentfxSwingLowRange = true;
      } else if (fxrCurrentLow < fxrMentfxLowerLevel) {
        fxrMentfxLowerLevel = fxrCurrentLow;
        fxrMentfxBreakIndex = true;
      }
    }

    if (!fxrMentfxSwingHighRange) {
      if (fxrIsPrevSwingHigh) {
        fxrMentfxUpperLevel = fxrLeftHigh;
        fxrMentfxSwingHighRange = true;
      } else if (fxrCurrentHigh > fxrMentfxUpperLevel) {
        fxrMentfxUpperLevel = fxrCurrentHigh;
        fxrMentfxBreakIndex = true;
      }
    }
  }

  fxrMentfxLastUpperLevel = fxrMentfxUpperLevel;
  fxrMentfxLastLowerLevel = fxrMentfxLowerLevel;
  fxrMentfxLatestTimeSec = Number.isFinite(fxrMentfxLatestTimeSec)
    ? Math.max(fxrMentfxLatestTimeSec, fxrCurrentBarTime)
    : fxrCurrentBarTime;

  const fxrMaxAgeSeconds = fxrMaxDays * 24 * 60 * 60;
  const fxrInWindow =
    fxrMaxDays === 0 ||
    fxrMentfxLatestTimeSec - fxrCurrentBarTime <= fxrMaxAgeSeconds;

  const fxrHighPlot =
    fxrInWindow && fxrMentfxUpperLevel !== fxrInitialUpperLevel
      ? fxrMentfxUpperLevel
      : NaN;
  const fxrLowPlot =
    fxrInWindow && fxrMentfxLowerLevel !== fxrInitialLowerLevel
      ? fxrMentfxLowerLevel
      : NaN;

  plot.line('MentFX High', fxrHighPlot, 'rgba(37, 150, 190, 1)', 0);
  plot.line('MentFX Low', fxrLowPlot, 'rgba(37, 150, 190, 1)', 0);
};
