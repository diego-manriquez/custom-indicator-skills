# Validation and Safety

Every FX Replay script is validated before the transformed PineJS version is used.

Author scripts so they survive both:

- static safety checks
- one simulated runtime pass

## What Validation Does

The validator:

1. Parses the script as JavaScript.
2. Rejects unsafe or unsupported constructs early.
3. Creates a mocked indicator runtime with globals such as `input`, `plot`, `band`, `color`, `calc`, `mtf`, `openC`, `closeC`, `high`, `low`, `time`, `volume`, and `index`.
4. Calls `init()`.
5. Reads the declared inputs.
6. Normalizes `input.src(...)` values into callable source functions.
7. Executes `onTick(1, moment, _, ta, inputs)` once with mocked values.

If any step throws, the script is rejected.

## Safety Restrictions

The interpreter performs AST-level safety checks before execution.

### Forbidden APIs

Do not use:

- `setTimeout`
- `setInterval`
- `requestAnimationFrame`
- `eval`
- `document`
- `navigator`
- `fetch`

### `new` Is Blocked

Constructor usage is rejected.

Avoid patterns such as:

- `new Array(...)`
- `new Set(...)`
- `new Map(...)`
- `new Date(...)`
- `new SomeHelper(...)`

Prefer plain objects, arrays, functions, and module-scope state instead.

### Oversized Arrays Are Rejected

The validator blocks obvious large allocations above the configured limit.

Examples that can fail:

- `Array(5000)`
- `Array.from({ length: 5000 })`
- very large array literals
- `[...Array(5000).keys()]`

Prefer bounded rolling arrays and cap them explicitly with `shift()` when needed.

## Runtime Implications For Authoring

Because `onTick(...)` is executed once in a mocked environment, scripts should be safe on the first bar.

Recommended guards:

- check `typeof source === 'function'` for `input.src(...)`
- check integer lengths before loops
- check `index < neededBars - 1` before accessing deep history
- check `Number.isFinite(...)` before plotting, drawing, or composing further math

If the indicator only works after enough history has accumulated, return early until the required lookback exists.

## Source Inputs During Validation

`input.src(...)` defaults are converted to callable source functions during validation.

Treat them like this:

```javascript
const source = inputs.source;
if (typeof source !== 'function') return;
const current = source(0);
```

Do not assume the value is a raw string such as `'close'`.

## MTF During Validation

Validation includes a mock `mtf` object.

Important consequence:

- `mtf.timeframe(...)` is recognized during transformation, but your author code still needs to declare it in `init`.
- `mtf` calculations may validate with mock values even when the real issue is structural.

If MTF behavior looks wrong, first check whether the timeframe declaration and access pattern match the interpreter rules.

## Error Handling Expectations

Validation errors are surfaced back as user-code failures with line mapping when possible.

Common causes:

- syntax errors
- reserved-name collisions
- first-bar history access without guards
- treating source inputs as strings instead of series functions
- unsupported browser or async APIs
- constructor usage via `new`

## Practical Debugging Heuristics

If a script fails validation, check these first:

1. Is `init` pure setup only?
2. Does `onTick` return safely on the first bar?
3. Are all arrays bounded when they grow over time?
4. Are all `input.src(...)` values treated as functions?
5. Is MTF declared in `init` and then read in `onTick`?
6. Does the script avoid browser, network, timer, and constructor APIs?
