# Canonical Functional Examples

All user-provided indicators in this set are treated as functional and good reference implementations.

Use this file to choose a starting point when a new request closely matches one of these structures.

## 1. Sessions Overlay With Stateful Rectangles and DST Markers

Use this example when the indicator needs:

- multiple configurable sessions
- `rectangle(...)` zones that update and then finalize
- DST handling
- grouped and inline inputs
- persistent session state objects

Key patterns:

- helper methods in module scope such as opacity conversion
- many `input.str`, `input.float`, `input.color`, and `input.int` controls
- reset logic when history rewinds or the visible context changes
- `verticalLine(...)` for calendar markers
- active box replacement through stored drawing IDs

## 2. Plot-Based Oscillator With Derived Series and Dynamic Colorer

Use this example when the indicator needs:

- a separate panel
- multiple derived arrays
- `ta.sma(...)` and `ta.rsi(...)`
- one main line plus dynamic coloring
- fixed guide lines or bands

Key patterns:

- `indicator({ onMainPanel: false, format: 'inherit' })`
- persistent series arrays outside `onTick`
- `plot.line(...)` plus `plot.colorer(...)`
- palette-index logic separated from the plot value calculation

## 3. Main-Panel FVG / IFVG Overlay With State Machine Logic

Use this example when the indicator needs:

- fair value gap detection
- stateful confirmation logic
- style changes after later confirmation
- arrays of tracked zones
- filters using MA slope, volume, or bias

Key patterns:

- parallel arrays for zone coordinates and state
- helper functions such as `calculateSMA`, `calculateSMAPast`, and `pushFvg`
- module-scope rolling series for volume and moving averages
- staged transitions like pending -> invalidated -> confirmed

## 4. Oscillator With Custom Rolling Formula and Mixed Plot Styles

Use this example when the indicator needs:

- custom oscillator math not fully delegated to `ta.*`
- rolling state across bars
- histogram-like lines plus dynamic line coloring
- threshold lines that change color based on state

Key patterns:

- module-scope series arrays
- persistent accumulator variables such as rolling RMA values
- mixed use of `plot.line(...)` and `plot.colorer(...)`
- explicit finite-value guards before plotting

## 5. Once-Per-Bar ATR Ratio Highlighter

Use this example when the indicator needs:

- once-per-bar array updates
- a panel plot plus occasional chart highlighting
- `ta.atr(...)` fed by custom OHLC arrays
- one rectangle per qualifying bar

Key patterns:

- `lastBarTime` guard
- bar-only array pushes
- capped history arrays
- panel plotting plus overlay-style rectangle creation

## 6. Candle Annotation Indicator

Use this example when the indicator needs:

- one label per bar
- simple once-per-bar execution
- candle component calculations
- text annotations on the main panel

Key patterns:

- `textPoint(...)`
- compact per-bar calculations
- configurable lookback via `input.int(...)`

## 7. Structure / BOS / MSS Overlay

Use this example when the indicator needs:

- pivot detection
- market structure break logic
- labels and horizontal marker lines
- directional state carried between signals

Key patterns:

- history arrays for highs and lows
- pivot search with symmetric lookback
- `rectangle(...)` used as a horizontal marker
- `textPoint(...)` for structure labels like `BOS` and `MSS`

## 8. Session Range and Daily Range Tracker

Use this example when the indicator needs:

- configurable sessions using `input.session(...)`
- timezone-aware logic
- active and historical session lines
- daily high/low tracking and midnight markers

Key patterns:

- session state objects
- helper functions for line replacement
- `_moment(...).tz('America/New_York')`
- retention cleanup for old drawings

## How To Use These Examples

- Start from the closest structure, not from the visually closest output.
- Reuse its state model first: arrays, objects, helpers, bar gate, or drawing lifecycle.
- Then adapt the inputs and visuals.
- If two examples are both relevant, borrow the state model from one and the rendering pattern from the other.
