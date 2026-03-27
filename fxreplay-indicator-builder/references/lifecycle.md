# Indicator Lifecycle

FX Replay indicators are structured around two main functions:

- `init = () => { ... }`
  Runs once when the indicator is loaded.
- `onTick = (length, _moment, _, ta, inputs) => { ... }`
  Runs on each market update.

## `init`

Use `init` for one-time setup only:

- define input controls
- configure display options
- register panel behavior with `indicator({ onMainPanel, format })` when needed
- register static visual guides such as `band.line(...)`
- prepare variables or buffers
- set up names or descriptions when supported

Do not place trading logic, price checks, or calculations here if they must update with the market.

## `onTick`

Use `onTick` for market-reactive work:

- read price data
- calculate indicator values
- evaluate conditions
- create or update plots
- create or update chart drawings

Because `onTick` runs frequently, keep it efficient. Heavy loops or unnecessary recalculation can degrade performance.

## Practical Rules

- `init` is configuration.
- `onTick` is execution.
- If something depends on live price updates, it belongs in `onTick`.
- If repeated drawings or actions are possible, track enough state to avoid duplicates.
- Persistent state that must survive between ticks should live in module-scope variables or arrays.
- If logic should run once per completed or current bar, gate it with `time(0)` or a similar timestamp check.
- If arrays grow every bar, cap their length when unbounded growth is unnecessary.
