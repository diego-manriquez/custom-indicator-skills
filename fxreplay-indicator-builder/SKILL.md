---
name: fxreplay-indicator-builder
description: Create or update FX Replay custom indicators from an idea, spec, or partial script. Use when the task is to author indicator code with init/onTick structure, add script inputs, organize indicator settings, or turn indicator logic into valid FX Replay script.
---

# FX Replay Indicator Builder

Use this skill when the user wants an FX Replay indicator written or extended.

Read these references before coding:

- Always read `references/lifecycle.md`.
- Always read `references/naming-and-reserved-names.md`.
- Read `references/inputs.md` when the indicator has user-configurable settings.
- Read `references/input-int.md` when integer inputs such as length, period, lookback, or bars-back are needed.
- Read `references/state-and-helpers.md` when the indicator needs persistent variables, arrays, helper functions, or once-per-bar state.
- Read `references/visual-patterns.md` when the indicator uses plots, bands, colorers, shapes, labels, sessions, or persistent drawing state.
- Read `references/example-catalog.md` only when a close working example would materially speed up implementation.
- Read `references/canonical-examples.md` when a known-good functional indicator pattern is needed as the starting point.

## Workflow

1. Identify the indicator goal, required outputs, and whether it belongs on the main chart or a separate panel.
2. Put setup only in `init`: inputs, names, options, and visual configuration.
3. Put market-reactive logic only in `onTick`: calculations, conditions, and drawings.
4. Keep `onTick` lean. Avoid heavy repeated work on every tick unless the indicator requires it.
5. Prevent duplicate drawings and repeated actions by storing or checking state when needed.
6. If the docs do not cover a behavior, say which assumption you are making instead of inventing certainty.

## Authoring Rules

- Do not place price checks, signal decisions, or other live market logic in `init`.
- Prefer clear input titles and stable IDs when the script references many inputs or when titles may change later.
- Use `group` to organize related settings and `inline` only when two fields clearly belong on the same row.
- Constrain numeric inputs with `min`, `max`, and `step` when the valid range is known.
- If inputs alone cannot protect the logic, add runtime guards in `onTick`.
- Keep persistent arrays and drawing IDs in module scope when they must survive across ticks.
- Keep helper functions in module scope when they are reused, computationally independent, or make `onTick` easier to read.
- Never introduce user-defined identifiers that collide with reserved runtime, interpreter, or editor names; prefer an `fxr` prefix for generated helpers, state, arrays, and inputs.
- For drawings that update over time, delete or replace prior IDs explicitly instead of stacking duplicates by accident.
- When an operation should happen once per candle, gate it with bar time instead of letting it fire on every tick.
- Favor simple, readable code over clever abstractions.

## Output Pattern

Unless the user asks for a different format, produce:

1. A complete FX Replay script snippet.
2. A short note explaining the main inputs.
3. A short note listing assumptions or unsupported parts of the docs.

## Starter Shape

```javascript
//@version=1
init = () => {
  // inputs and one-time configuration
};

onTick = (length, _moment, _, ta, inputs) => {
  // per-tick calculations and drawings
};
```
