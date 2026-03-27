# `input.int`

Use `input.int` for whole-number settings such as period, length, lookback, or bars to inspect.

## Syntax

```javascript
input.int(title, value, id?, min?, max?, step?, tooltip?, group?, inline?)
```

## Parameters

- `title`: label shown in the Inputs panel
- `value`: default integer value
- `id`: optional stable key; if omitted it is auto-generated from the title
- `min`: optional minimum allowed value
- `max`: optional maximum allowed value
- `step`: optional increment between values
- `tooltip`: optional help text
- `group`: optional section name
- `inline`: optional row-alignment key

## Return Value

Use the explicit input ID to read the resolved value from `inputs` inside `onTick`.

## Guidance

- Use `min` and `max` when the indicator requires a safe range.
- Use `step` to make spinner increments match the parameter's intent.
- Prefer descriptive titles like `SMA Length` instead of generic names like `Length`.
- Group related numeric settings together for cleaner configuration.

## Example

```javascript
init = () => {
  input.int(
    'SMA Length',
    14,
    'smaLength',
    1,
    200,
    1,
    'Number of bars used to calculate SMA',
    'Moving Averages',
    'ma-row'
  );
};

onTick = (length, _moment, _, ta, inputs) => {
  const smaLength = inputs.smaLength;
  if (!Number.isFinite(smaLength) || smaLength < 1) return;
};
```
