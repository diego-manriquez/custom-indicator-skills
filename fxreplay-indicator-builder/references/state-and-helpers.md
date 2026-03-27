# State and Helpers

Use this reference when an FX Replay indicator needs values, arrays, drawing IDs, or helper functions that must exist outside `onTick`.

## What Belongs Outside `onTick`

Put these in module scope when they must survive across ticks:

- rolling arrays and history buffers
- state objects for sessions or multi-step logic
- drawing IDs that will be updated or deleted later
- per-bar guard variables like `lastBarTime`
- helper functions reused by `onTick`

## Persistent Variables

Simple persistent state:

```javascript
let lastBarTime = null;
let activeBoxId = null;
let structureTrend = 0;
```

Use this for flags, last processed timestamps, direction state, or object IDs.

## Persistent Arrays

Use arrays when the indicator builds rolling history or feeds `ta.*` functions:

```javascript
const closeSeries = [];
const customSeries = [];
```

Typical pattern:

```javascript
const t0 = time(0);
const isNewBar = t0 !== lastBarTime && ((lastBarTime = t0), true);

if (isNewBar) {
  closeSeries.push(closeC(0));
  if (closeSeries.length > 500) closeSeries.shift();
}
```

This avoids pushing multiple duplicate values during the same candle.

For PineJS-style state machines that only look back a few candles, prefer tiny capped buffers instead of rescanning large history:

```javascript
const openBars = [];
const highBars = [];
const lowBars = [];
const closeBars = [];

onTick = () => {
  const t0 = time(0);
  if (!t0 || t0 === lastBarTime) return;
  lastBarTime = t0;

  pushRecent(openBars, openC(0), 3);
  pushRecent(highBars, high(0), 3);
  pushRecent(lowBars, low(0), 3);
  pushRecent(closeBars, closeC(0), 3);

  if (openBars.length < 3) return;
  // current, left, two-left logic here
};
```

This is often a better fit than full-history recomputation for stepped structure indicators.

## Using `ta.*` With Arrays

`ta.*` is a strong fit when the indicator owns its own history buffers.

Typical pattern:

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
};
```

Keep in mind:

- many `ta.*` helpers return arrays
- you usually want the latest element
- source functions like `inputs.source` should be sampled first and then pushed into arrays when the helper expects array input

## State Objects

Use objects when several related fields must move together:

```javascript
let sessionState = {
  start: 0,
  high: -Infinity,
  low: Infinity,
  boxId: null,
  closed: false,
};
```

This works well for:

- sessions
- multi-stage pattern detection
- provisional drawings that later finalize
- daily reset logic

## Helper Functions

Keep helpers outside `onTick` when they are:

- reused in more than one place
- conceptually separate from tick orchestration
- easier to test mentally as standalone logic

Examples:

```javascript
const calculateSMA = (source, length) => {
  let sum = 0;
  for (let i = 0; i < length; i++) sum += source(i);
  return sum / length;
};

const applyOpacity = (c, op) => {
  const alpha = (100 - op) / 100;
  return c;
};
```

Guidelines:

- Prefer pure helpers when possible.
- Pass dependencies in as arguments instead of mutating unrelated global state.
- Keep orchestration and side effects in `onTick` unless a small helper clearly improves readability.
- Do not let module-scope helpers close over mutable module-scope state by name when that state is meant to persist between ticks. In this runtime, those variables are often lifted into `state.*`, so helpers should either be pure, receive the needed state as arguments, or read/write `state` explicitly.

## When Not to Move Logic Out

Do not move logic out of `onTick` if it fundamentally depends on current market evaluation and becomes harder to follow when extracted.

Examples:

- a short one-off condition
- a single `plot.line(...)` call
- tiny guards used once

## Common Pattern: Once-Per-Bar Gate

```javascript
let lastProcessedBarTs = null;

onTick = () => {
  const t0 = time(0);
  if (!t0) return;
  if (lastProcessedBarTs === t0) return;
  lastProcessedBarTs = t0;

  // logic that should run once per bar
};
```

Use this when:

- appending to arrays
- creating one label or shape per candle
- resetting or rolling session state once

## Common Pattern: Drawing ID Lifecycle

```javascript
let boxId = null;

onTick = () => {
  if (boxId !== null) deleteDrawingById(boxId);
  boxId = rectangle(startTs, top, time(0), bottom, style);
};
```

Use this when the latest drawing replaces the previous version instead of accumulating history.
