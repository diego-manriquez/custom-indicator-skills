# Script Inputs

Define user-configurable inputs inside `init`.

Inputs are used to expose indicator settings such as:

- lengths
- thresholds
- toggles
- colors
- sessions
- price sources
- text values
- time settings

Common helpers seen in working indicators:

- `input.bool(...)`
- `input.str(...)`
- `input.int(...)`
- `input.float(...)`
- `input.color(...)`
- `input.src(...)`
- `input.session(...)`

## Design Rules

- Use descriptive titles so the settings panel stays understandable.
- Use `group` to cluster related parameters.
- Use `inline` only for controls that should share the same row.
- Add `tooltip` text when a parameter is not obvious.
- Prefer sensible defaults that work without immediate tuning.
- Use empty labels only when another inline control already provides the visible label.
- Reuse `group` names like `Style`, `Volume`, `Sessions`, or `Display` to keep settings coherent.

## Safety Rules

- Use `min`, `max`, and `step` when the docs for that input type support them.
- Do not assume UI limits fully protect runtime logic; add guards in `onTick` when invalid values could still break calculations.

## Access Pattern

Input helpers register the input definition. If you need the current resolved value inside `onTick`, read it from the `inputs` argument using the stable input ID string.

A robust pattern is:

```javascript
init = () => {
  input.int('SMA Length', 14, 'smaLength', 1, 200, 1);
};

onTick = (length, _moment, _, ta, inputs) => {
  const smaLength = inputs.smaLength;
  if (!Number.isFinite(smaLength) || smaLength < 1) return;
};
```

For `input.src(...)`, the runtime value should be treated as a callable source series:

```javascript
init = () => {
  input.src('Source', 'close', 'source');
};

onTick = (length, _moment, _, ta, inputs) => {
  const source = inputs.source;
  if (typeof source !== 'function') return;
  const current = source(0);
};
```

`inputs.someId` and `inputs['someId']` are both valid patterns when the ID is known.

Do not use `inputCall.id`. In this runtime, the safe lookup key is the explicit ID string you passed to `input.*(...)`.
