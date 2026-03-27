# `ta.*` Methods

Use this reference when an indicator builds its own history arrays and wants to use the `ta` helper exposed inside `onTick`.

## Where `ta` Exists

`ta` is available inside:

```javascript
onTick = (length, _moment, _, ta, inputs) => {
  // use ta here
};
```

Do not use `ta` in `init`.

## Mental Model

`ta.*` is an array-oriented runtime helper library.

That means:

- it is best when the script already maintains explicit arrays such as `closeHistory`, `highHistory`, or `volumeHistory`
- many methods return a full output array, not just the latest value
- the usual pattern is "push current bar once -> run `ta.*` -> read the last value"

This is different from `calc.*`, which is the interpreter-aware path that maps more directly to PineJS stdlib calls.

## When To Use `ta.*`

Prefer `ta.*` when:

- the script already stores custom rolling arrays
- the formula combines multiple array-based steps
- you need array utilities like `rolling(...)` or `pointwise(...)`
- you are reproducing logic like VWAP bands, custom oscillators, or weighted formulas on user-managed buffers

Prefer `calc.*` when:

- a built-in helper already matches the needed calculation
- you want the simplest path toward PineJS-oriented transformation
- the script is naturally series-based rather than array-buffer-based

## Common Pattern

```javascript
const closeHistory = [];
let lastBarTime = null;

onTick = (length, _moment, _, ta, inputs) => {
  const t0 = time(0);
  if (!t0 || t0 === lastBarTime) return;
  lastBarTime = t0;

  closeHistory.push(closeC(0));
  if (closeHistory.length > 300) closeHistory.shift();

  const emaSeries = ta.ema(closeHistory, 20);
  const emaValue = emaSeries[emaSeries.length - 1];
  if (!Number.isFinite(emaValue)) return;

  plot.line('EMA', emaValue, color.blue, 0);
};
```

## Return Shape Guidance

Many `ta.*` helpers return arrays:

- `ta.sma(...)`
- `ta.ema(...)`
- `ta.wma(...)`
- `ta.wwma(...)`
- `ta.vwma(...)`
- `ta.stdev(...)`
- `ta.madev(...)`
- `ta.expdev(...)`
- `ta.atr(...)`
- `ta.rma(...)`
- `ta.wilderSmooth(...)`
- `ta.typicalPrice(...)`
- `ta.medianPrice(...)`
- `ta.trueRange(...)`

These usually need:

```javascript
const values = ta.ema(closeHistory, 20);
const latest = values[values.length - 1];
```

Some helpers return a single scalar:

- `ta.avg(...)`
- `ta.wavg(...)`
- `ta.sd(...)`
- `ta.cov(...)`
- `ta.cor(...)`
- `ta.mad(...)`
- `ta.mae(...)`
- `ta.rmse(...)`
- `ta.nrmse(...)`
- `ta.mape(...)`

## Useful Families

### Moving-average style

- `ta.sma`
- `ta.ema`
- `ta.wma`
- `ta.wwma`
- `ta.rma`
- `ta.vwma`

### Volatility / dispersion

- `ta.stdev`
- `ta.madev`
- `ta.expdev`
- `ta.atr`
- `ta.trueRange`

### Price transforms

- `ta.medianPrice`
- `ta.typicalPrice`

### Array composition helpers

- `ta.pointwise`
- `ta.rolling`

## Important Constraints

- Do not pass a source function like `inputs.source` directly into array-oriented `ta.*` methods that expect arrays.
- Build or maintain arrays first, then call `ta.*`.
- Gate pushes by bar time when duplicate intrabar samples would corrupt the calculation.
- Cap arrays when old history is no longer needed.
- Add finite-value guards before plotting the latest output.

## Example: RSI Using `ta.rma`

`ta` does not need to expose a dedicated `ta.rsi(...)` for RSI to be implementable.

A reliable pattern is:

1. build source history
2. derive gain and loss arrays
3. call `ta.rma(gains, period)` and `ta.rma(losses, period)`
4. compute the latest RSI from the last smoothed values

See [examples/rsi.js](/Users/diego/fx-replay/custom-indicators-skills/examples/rsi.js) for a working example.
