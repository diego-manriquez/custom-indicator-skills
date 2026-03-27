# Naming and Reserved Names

Read this reference before writing or refactoring any FX Replay indicator.

FX Replay injects runtime identifiers and editor globals before user code runs. Do not use the following names for user-defined variables, functions, constants, helpers, input handles, arrays, or module-scope state.

## Hard Reserved

```ts
[
  'init',
  'onTick',
  'main',
  'context',
  'PineJS',
  'plot',
  'input',
  'inputs',
  'calc',
  'mtf',
  'color',
  'state',
  '_moment',
  '_',
  'ta',
  'length',
  'console',
  '__drawings',
  '__getInput',
  '__inputsByName',
  '__srcOf',
  '__plotIndex',
  'createNewVar',
  'createNewSeries',
  'plotIndex',
  'index',
  'sessionId',
  'mainSymbolTime',
  'secondarySymbolTime'
]
```

## Runtime and Editor Globals

```ts
[
  'band',
  'indicator',
  'candles',
  'iconList',
  'StickersList',
  'isLastProcessedBar',
  'newVar',
  'newSeries',
  'createSeries',
  'newPoint',
  'openC',
  'closeC',
  'high',
  'low',
  'time',
  'volume',
  'getTradingHours',
  'getSessionFormat',
  'getTimezone',
  'getMinTick',
  'getPeriod',
  'getAssetType'
]
```

## Interpreter Compatibility Reserved

Treat these as reserved too, even when a collision is not obvious:

```ts
[
  'bool',
  'value',
  'string',
  'integer',
  'float',
  'session',
  'text',
  'line'
]
```

## Drawing Helpers Also Reserved

Do not reuse built-in drawing helper names such as:

```ts
[
  'trendLine',
  'rayLine',
  'infoLine',
  'extendedLine',
  'trendAngle',
  'horizontalLine',
  'horizontalRay',
  'verticalLine',
  'crossLine',
  'parallelChannel',
  'regressionTrend',
  'flatBottom',
  'disjointChannel',
  'insidePitchfork',
  'pitchfork',
  'schiffPitchfork',
  'schiffPitchforkModified',
  'fibRetracement',
  'fibTrendExt',
  'fibChannel',
  'fibTimezone',
  'fibSpeedResistFan',
  'fibTrendTime',
  'fibCircles',
  'fibSpiral',
  'fibSpeedResistArcs',
  'fibWedge',
  'pitchfan',
  'gannbox',
  'gannSquareFixed',
  'gannboxFan',
  'gannSquare',
  'xabcdPattern',
  'cypherPattern',
  'headAndShoulders',
  'abcdPattern',
  'trianglePattern',
  'threeDiverPattern',
  'cyclicLines',
  'timeCycles',
  'sineLine',
  'longPosition',
  'shortPosition',
  'forecast',
  'barsPattern',
  'ghostFeed',
  'projection',
  'anchoredVWAP',
  'fixedRangeVolumeProfile',
  'priceRange',
  'dateRange',
  'dateAndPriceRange',
  'arrowUp',
  'arrowDown',
  'arrowLeft',
  'arrowRight',
  'arrow',
  'arrowMarker',
  'rectangle',
  'rotatedRectangle',
  'path',
  'circle',
  'ellipse',
  'polyline',
  'triangle',
  'arcLine',
  'curve',
  'doubleCurve',
  'anchoredNote',
  'note',
  'callout',
  'comment',
  'priceLabel',
  'priceNote',
  'signpost',
  'textPoint',
  'anchoredText',
  'flag',
  'icon',
  'emoji',
  'sticker',
  'updateDrawingById',
  'deleteDrawingById',
  'deleteDrawingByCondition'
]
```

## Naming Convention

- Prefer `fxr` as the prefix for generated identifiers.
- Use descriptive names such as `fxrFastLengthInput`, `fxrTrendBias`, `fxrAtrSeries`, and `fxrDrawSignalLabel`.
- Do not use `__` prefixes for user names.
- Avoid generic names like `value`, `line`, `text`, `state`, `context`, `input`, and `plot` even when the collision is not immediately visible.

## Safe Examples

```javascript
const fxrLengthInput = input.int('Length', 14, 'fxrLength', 1, 200, 1);
let fxrLastBarTime = null;
const fxrCloseSeries = [];

const fxrCalcSignal = () => {
  return closeC(0) > openC(0);
};
```
