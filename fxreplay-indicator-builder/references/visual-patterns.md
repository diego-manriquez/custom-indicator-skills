# Visual and State Patterns

This reference distills common patterns from working FX Replay indicators that use plots and drawing APIs.

## Panel and Static Setup

Configure panel behavior in `init`:

```javascript
init = () => {
  indicator({ onMainPanel: false, format: 'inherit' });
  band.line('Level 80', 80, '#787B86', 2, 1);
};
```

Use `onMainPanel: true` for overlays and `false` for oscillator-style indicators in a separate pane.

## Plot Patterns

Use `plot.line(name, value, color, styleOrWidth)` for dynamic series values:

```javascript
plot.line('AO Line', centered, '#00ffbb', 0);
```

When reading inputs in `onTick`, use the resolved value from `inputs`, commonly with dot access when the ID is a simple identifier:

```javascript
const period = inputs.period;
const source = inputs.source;
```

When the plot color must react to state, attach a `plot.colorer(...)` to the plot name:

```javascript
plot.colorer('AO Line Colorer', lineIndex, 'AO Line', [
  { name: 'Pos Rising', color: 'rgba(0,255,187,1)' },
  { name: 'Pos Falling', color: 'rgba(0,255,187,0.3)' },
]);
```

Rules:

- The third argument of `plot.colorer` must match the plot name exactly.
- Use stable palette indexes so the color mapping remains easy to review.
- Prefer literal colors or runtime color constants inside color palettes.
- Horizontal guides can be regular plots or `band.line(...)` depending on whether they are dynamic or static.

## Filled Areas

Use `plot.filledArea(...)` after the referenced plots have been declared:

```javascript
plot.line('Upper Band', upperBand, '#00FF00', 0);
plot.line('Lower Band', lowerBand, '#FF0000', 0);
plot.filledArea(
  'band_fill',
  'Upper Band',
  'Lower Band',
  'Band Fill',
  '#0000FF',
  60,
  true,
  'plot_plot'
);
```

Guidance:

- The second and third arguments must match the referenced plot titles exactly.
- Prefer static colors for `plot.filledArea(...)`, such as hex strings, rgba strings, or runtime constants like `color.red`.
- Do not assume `plot.filledArea(...)` supports input-driven dynamic color expressions the same way a line plot may tolerate dynamic color handling.
- Use `transparency` for visibility tuning instead of relying only on alpha in the color string.

## Drawing Patterns

Common drawing helpers seen in working indicators:

- `rectangle(...)`
- `trendLine(...)`
- `rayLine(...)`
- `horizontalLine(...)`
- `horizontalRay(...)`
- `verticalLine(...)`
- `textPoint(...)`
- `flag(...)`
- `icon(...)`

For structure-style overlays such as swing highs/lows, BOS, MSS, session ranges, and horizontal break markers, prefer these drawing helpers over `plot.shapes(...)`.

Example:

```javascript
if (isSwingHigh) {
  textPoint(time(swingLength), high(swingLength), 'SH', {
    color: color.white,
    backgroundColor: color.red,
    fontsize: 10,
    bold: true,
    fillBackground: true
  });
}
```

For drawings that update through the bar or across sessions, store IDs and delete old drawings before redrawing:

```javascript
if (state.box !== null) deleteDrawingById(state.box);
state.box = rectangle(startTs, top, time(0), bottom, style);
```

Use this pattern when a shape is provisional and should be replaced as the current bar evolves.

Today, keep the `deleteDrawingById(...)` call in `onTick`. Module-scope helpers can prepare state and geometry, but lifecycle helpers are not reliably rewritten there yet.

Lifecycle helpers that are also available:

- `updateDrawingById(...)`
- `deleteDrawingById(...)`
- `deleteDrawingByCondition(...)`

## Once-Per-Bar Gates

Some logic should not run on every tick. Gate it with the current bar timestamp:

```javascript
let lastBarTime = null;

onTick = () => {
  const t0 = time(0);
  if (t0 === lastBarTime) return;
  lastBarTime = t0;
};
```

This is useful for:

- pushing values into history arrays once per bar
- placing one label or highlight per candle
- avoiding duplicate session markers

## Persistent State

Place persistent state outside `init` and `onTick`:

```javascript
const series = [];
let lastProcessedBarTs = null;
let activeBoxId = null;
```

Use persistent state for:

- rolling arrays used by `ta.*` helpers
- session state machines
- previously drawn object IDs
- daily or per-session reset logic

## Time and Session Patterns

Examples show two useful approaches:

- direct timezone logic with `_moment(...).tz(...)` or `.utc()`
- user-configurable sessions with `input.session(...)`

When session logic spans midnight, compare times carefully and explicitly handle wrapped ranges.

## Performance Notes

- Cap arrays if old values are no longer needed.
- Avoid scanning too much history on every tick unless the indicator truly requires it.
- Return early when prerequisites are not met, such as missing history or invalid numbers.
- Prefer small helpers for repeated drawing updates or session handling when they improve readability.
