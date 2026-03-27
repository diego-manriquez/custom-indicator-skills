# Debug Checklist

Use this checklist when reviewing or repairing an FX Replay indicator.

## Lifecycle

- Does `init` only perform one-time setup?
- Is all market-reactive logic inside `onTick`?
- Is there any calculation in `init` that should refresh with price?

## Inputs

- Are input titles descriptive?
- Are `min`, `max`, and `step` provided where useful?
- Are related controls grouped with `group`?
- Is `inline` used only when it improves readability?
- Are input IDs stable enough for long-term maintenance?

## Runtime Logic

- Can the script create duplicate drawings on repeated ticks?
- Are there missing checks before using user input values?
- Is there expensive repeated work that could be simplified?
- Is state needed to prevent repeated signals or markers?
- Are history arrays capped when they do not need unbounded growth?
- Is once-per-bar logic actually gated by timestamp or equivalent state?

## Visual Logic

- Does `plot.colorer` target the correct plot name?
- Are static guides defined once in `init` when possible?
- Are provisional drawings deleted before replacement?
- Are session or timezone drawings protected against duplicate creation?

## Output Quality

- Does the script remain readable after the fix?
- Are assumptions explicitly stated when the documentation is incomplete?
