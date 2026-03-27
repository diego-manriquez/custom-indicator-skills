# Interpreter and PineJS Model

Author FX Replay scripts with the real execution pipeline in mind:

1. The user writes simplified JavaScript with `init` and `onTick`.
2. The platform parses and validates that code.
3. The interpreter rewrites supported runtime helpers into PineJS-compatible code.
4. The final output becomes a PineJS `this.main = (...) => { ... }` function, and sometimes a generated `this.init = (...) => { ... }` when MTF is used.

The safest scripts are the ones that already look easy to translate into PineJS series logic.

## Mental Model

Do not think of the script as unrestricted app JavaScript.

Think of it as:

- a compact indicator DSL written in JavaScript syntax
- executed once in a validator with mocked market data
- then transpiled into PineJS-oriented series code

This means the best authoring style is:

- series-oriented
- deterministic
- runtime-safe on the first bar
- explicit about inputs, guards, and state

## Stable Transformations

These patterns have direct interpreter support and should be preferred when they fit the indicator:

### Price/time series access

Use:

- `openC(index)`
- `closeC(index)`
- `high(index)`
- `low(index)`
- `volume(index)`
- `time(index)`

These are rewritten into PineJS-backed series accessors.

### `calc.*` helpers

Use `calc.*` for TA operations that already exist in the runtime API. These calls are rewritten to `PineJS.Std.*` with `context`.

Typical supported examples include:

- `calc.tr(...)`
- `calc.atr(...)`
- `calc.sma(...)`
- `calc.rma(...)`
- `calc.ema(...)`
- `calc.wma(...)`
- `calc.vwma(...)`
- `calc.linreg(...)`

Prefer these helpers over ad hoc wrappers when the logic is already available there.

### `ta.*` helpers

`ta.*` is also available in `onTick`, but it serves a different purpose than `calc.*`.

Use `ta.*` when:

- the script keeps explicit arrays outside `onTick`
- the indicator intentionally works from buffered history
- the math is easier to express as array transforms than as direct series calls

Important distinction:

- `calc.*` is the interpreter-aware path that maps more directly to PineJS stdlib calls
- `ta.*` is an array-oriented runtime helper library

Do not treat `ta.*` as if it were a drop-in replacement for direct PineJS series helpers. Author it as explicit array math.

### `newVar(...)` and `newSeries(...)`

These are interpreter-aware state helpers:

- `newVar(...)` maps to `context.new_var(...)`
- `newSeries(...)` maps to `context.new_unlimited_var(...)`

Use them when the indicator logic truly needs Pine-style persistent series state. Do not recreate `context.*` calls manually in the custom script.

### `input.src(...)`

Treat source inputs as source selectors, not plain strings.

In author code:

```javascript
init = () => {
  input.src('Source', 'close', 'fxrSource');
};
```

In `onTick`, the resolved input value should be treated as a series function:

```javascript
const fxrSource = inputs['fxrSource'];
if (typeof fxrSource !== 'function') return;
const current = fxrSource(0);
```

The validator normalizes source defaults into callable series functions, and the interpreter rewrites source inputs for PineJS using an internal source mapper.

### `mtf.*`

MTF is not just a runtime convenience. It has dedicated interpreter support.

Rules:

- Call `mtf.timeframe(...)` in `init`, not in `onTick`.
- Static strings like `'1D'` are supported.
- Input-driven timeframes are also supported when the value comes from an `input.*` alias declared in `init`.
- `mtf.high/low/openC/closeC/volume/time` are auto-adopted to the main symbol.
- `mtf.ema/sma/rsi/atr` are also transformed into PineJS adopt flows.

When you need MTF, describe the higher timeframe declaratively and let the interpreter generate the PineJS symbol wiring.

### Drawings

Drawing helpers such as `rectangle(...)`, `trendLine(...)`, `textPoint(...)`, and related deletion/update helpers are intercepted by the interpreter.

The runtime injects tracking arguments such as `plotIndex` and `sessionId` automatically.

Authoring guidance:

- call the drawing helper normally
- store returned IDs when the shape must later be updated or deleted
- do not try to pass `plotIndex` or `sessionId` yourself

### Plot coloring and filled areas

The most reliable visual patterns are:

- `plot.line(...)` for values
- `plot.colorer(...)` for state-driven palette changes on an existing plot
- `plot.filledArea(...)` with static fill colors between already-declared plots

Important limitation:

- Do not assume every plot API supports input-driven dynamic colors equally.
- `plot.filledArea(...)` is safest when its color is a literal or runtime color constant, not a value coming from an input lookup.

## Authoring Recommendations

- Keep `init` declarative: inputs, visual config, MTF declaration, and one-time setup only.
- Keep `onTick` close to the final series logic you would expect in PineJS.
- Prefer supported runtime helpers over generic abstractions when both solve the same problem.
- Keep helper functions pure when possible so the interpreter only has to transform the call sites that matter.
- Add first-bar and insufficient-history guards early.
- Use finite-number guards before plotting or drawing.
- If a PineJS-native example uses `context.select_sym`, `context.new_var`, or `PineJS.Std.*`, translate the intent back into the supported FX Replay script API instead of copying PineJS internals directly.

## Smells That Usually Age Badly

These patterns are more likely to be brittle after transformation:

- app-style utility layers that hide all series access
- `init` code that depends on live market values
- helpers that assume inputs are raw strings when they are actually source functions
- MTF logic declared outside `init`
- scripts that only work after many bars but never guard `index` or history depth

## Quick Self-Check

Before finalizing a script, ask:

- Would `init()` make sense if run once before market logic?
- Would one mocked `onTick(...)` call avoid exceptions on the first bar?
- Am I using supported helpers that the interpreter already knows how to rewrite?
- Am I expressing MTF, sources, and state in the simplest form the transpiler can understand?
