---
name: fxreplay-indicator-debugger
description: Review and fix FX Replay custom indicator scripts. Use when an existing indicator behaves incorrectly, is slow, duplicates drawings, misuses init/onTick, or needs its inputs cleaned up to match FX Replay scripting conventions.
---

# FX Replay Indicator Debugger

Use this skill when the user already has an FX Replay indicator and wants review, debugging, cleanup, or a correctness pass.

Read these references before changing code:

- `../fxreplay-indicator-builder/references/lifecycle.md`
- `../fxreplay-indicator-builder/references/interpreter-and-pinejs.md`
- `../fxreplay-indicator-builder/references/validation-and-safety.md`
- `../fxreplay-indicator-builder/references/inputs.md` if the script uses configurable parameters
- `../fxreplay-indicator-builder/references/input-int.md` if integer inputs are involved
- `../fxreplay-indicator-builder/references/state-and-helpers.md` if the script keeps arrays, helper methods, state objects, or per-bar guards outside `onTick`
- `../fxreplay-indicator-builder/references/visual-patterns.md` if the script uses plots, colorers, shapes, text labels, or session drawings
- `../fxreplay-indicator-builder/references/example-catalog.md` only when a similar working pattern is needed to guide a fix
- `../fxreplay-indicator-builder/references/canonical-examples.md` when comparing a buggy script against a known-good functional structure
- `references/checklist.md`

## Review Priorities

1. Confirm `init` contains setup only.
2. Confirm `onTick` contains calculations and dynamic chart updates.
3. Confirm the script uses interpreter-friendly patterns that will survive transformation to PineJS.
4. Look for repeated drawings, repeated signals, or missing guards.
5. Look for unnecessary work performed on every tick.
6. Verify that plots and colorers are wired consistently.
7. Verify that inputs are named clearly and constrained when the allowed range is known.
8. Verify first-bar safety, source-input handling, and MTF declaration placement.

## Fix Strategy

- Move live logic out of `init` and into `onTick`.
- Replace brittle app-style patterns with interpreter-aware constructs when the transformation layer already supports them.
- Add input constraints and runtime guards when values can become invalid.
- Reduce duplicated work inside `onTick`.
- Add once-per-bar gates when arrays, labels, or drawings should not update multiple times inside the same candle.
- Ensure drawing IDs are deleted or replaced when the intended behavior is "update" instead of "accumulate".
- Fix validation blockers such as unsupported APIs, constructor usage, missing history guards, or misuse of `input.src(...)`.
- Preserve user-visible behavior unless the bug itself requires a behavior change.
- If the docs are incomplete, state the assumption behind the fix.

## Response Shape

When reviewing code, prioritize:

1. bugs and behavior risks
2. performance risks
3. missing safeguards
4. only then small cleanup items
