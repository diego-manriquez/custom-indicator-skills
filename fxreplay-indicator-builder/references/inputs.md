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

Input helpers return an object with an `id`.

The selected value is then read from the `inputs` argument in `onTick`:

```javascript
const periodInput = input.int('SMA Length', 14, 'smaLength', 1, 200, 1);

onTick = (length, _moment, _, ta, inputs) => {
  const period = inputs[periodInput.id];
};
```
