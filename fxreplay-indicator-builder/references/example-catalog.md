# Example Catalog

Use this reference when a close working example is more useful than abstract rules.

Do not copy blindly. Adapt the pattern to the user's requested indicator and keep only the parts that are necessary.

The examples referenced here are treated as functional, validated indicators. Use them as trusted pattern sources, then adapt only the required parts.

## Example Types to Reuse

### 1. Plot-Based Oscillator

Use when the indicator:

- lives in a separate panel
- builds one or more rolling arrays
- uses `ta.*` helpers
- renders with `plot.line(...)` and `plot.colorer(...)`

Patterns shown in the provided examples:

- `indicator({ onMainPanel: false, format: 'inherit' })`
- rolling arrays for derived series
- `ta.sma(...)`, `ta.rsi(...)`, `ta.atr(...)`
- line plots plus dynamic palette coloring
- static guides with `band.line(...)` or fixed-value plots

### 2. Shape-Based Overlay

Use when the indicator:

- draws on the main chart
- uses `rectangle(...)`, `trendLine(...)`, `verticalLine(...)`, or `textPoint(...)`
- needs persistent drawing IDs
- updates or finalizes shapes over time

Patterns shown in the provided examples:

- storing drawing IDs in variables or state objects
- deleting old IDs before replacement
- extending session boxes or trend lines as price evolves
- labeling structures like `BOS` or `MSS`

### 3. Session Tracker

Use when the indicator:

- depends on timezones or trading sessions
- tracks highs and lows during a window
- needs daily resets or history retention

Patterns shown in the provided examples:

- `_moment(...).tz(...)` and `.utc()`
- `input.session(...)`
- session state objects with `start`, highs, lows, and drawing IDs
- filtering old drawings by age or visible-day cutoff

### 4. Once-Per-Bar Highlighter

Use when the indicator:

- should react once per completed or current bar
- pushes OHLC values into arrays only once
- creates a single highlight or label per qualifying candle

Patterns shown in the provided examples:

- `lastBarTime` or `lastProcessedBarTs`
- `isNewBar` boolean derived from `time(0)`
- one rectangle or one text label per bar

### 5. State Machine Pattern

Use when the indicator:

- tracks staged behavior such as pending -> invalidated -> confirmed
- needs arrays of active zones or objects
- decides styling based on later confirmation

Patterns shown in the provided examples:

- parallel arrays for left/top/bottom/state
- integer state markers like `0`, `1`, `2`
- style changes after confirmation filters pass

## Selection Guidance

- If the user asks for an oscillator, start from the plot-based pattern.
- If the user asks for zones, sessions, or labels on price, start from the shape-based pattern.
- If the user mentions persistence, arrays, or helper methods outside `onTick`, pair this file with `state-and-helpers.md`.
- If the script is buggy rather than new, use the pattern only to guide the fix and preserve existing behavior where possible.
- For concrete known-good structures, read `canonical-examples.md`.
