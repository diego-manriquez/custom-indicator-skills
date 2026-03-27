# Drawing API

Use this reference when an indicator should annotate price with chart drawings instead of plot-based marks.

These methods are exposed by the indicator runtime and are the preferred path for structure overlays, zones, markers, and evolving chart objects.

## When To Prefer Drawings

Prefer drawing APIs over `plot.shapes(...)` when the indicator needs:

- swing labels
- BOS or MSS markers
- horizontal break levels
- session boxes
- evolving zones
- trend or projection lines
- reusable object IDs that may later be updated or deleted

## Commonly Useful Methods

### Structure and zone work

- `rectangle(...)`
- `trendLine(...)`
- `rayLine(...)`
- `horizontalLine(...)`
- `horizontalRay(...)`
- `verticalLine(...)`
- `textPoint(...)`

### Marker-style drawings

- `arrowUp(...)`
- `arrowDown(...)`
- `arrowLeft(...)`
- `arrowRight(...)`
- `flag(...)`
- `icon(...)`
- `emoji(...)`
- `sticker(...)`

### Lifecycle helpers

- `updateDrawingById(...)`
- `deleteDrawingById(...)`
- `deleteDrawingByCondition(...)`

## Runtime Model

The interpreter already knows these drawing helpers.

Important consequence:

- call them with their user-facing arguments only
- do not try to pass `plotIndex` or `sessionId`
- the runtime injects those tracking arguments automatically

## Common Patterns

### One label per confirmed swing

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

### Horizontal break marker

```javascript
rectangle(time(barsAgo), breakPrice, time(0), breakPrice, {
  color: color.green,
  linewidth: 2
});
```

### Replace the previous provisional drawing

```javascript
if (activeBoxId !== null) deleteDrawingById(activeBoxId);
activeBoxId = rectangle(startTs, top, time(0), bottom, style);
```

## Choosing The Right Primitive

- Use `textPoint(...)` for compact labels like `SH`, `SL`, `BOS`, and `MSS`.
- Use `rectangle(...)` for horizontal markers, ranges, and zones.
- Use `trendLine(...)` or `rayLine(...)` when the visual object should imply direction or extension.
- Use `horizontalLine(...)` when only a single price level matters and no start/end time is needed.
- Use `flag(...)`, `icon(...)`, or arrow markers when the output is primarily symbolic.

## Practical Guardrails

- Gate once-per-bar logic with `time(0)` when labels or zones should not duplicate intrabar.
- Persist drawing IDs outside `onTick` when drawings must be updated or removed later.
- Persist last-processed timestamps or swing times so the same confirmed event is not drawn twice.
- Use chart time and chart price values directly, for example `time(offset)` and `high(offset)`.

## API Breadth

The runtime exposes a broader drawing set beyond the common helpers above, including:

- channels
- pitchforks
- fibonacci tools
- gann tools
- elliott wave tools
- projection tools
- measured ranges

For skill-guided indicator generation, default to the simpler primitives first unless the user explicitly asks for one of those advanced drawing families.
