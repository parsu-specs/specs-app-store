# Fluid text experiment

Off by default. Uses CSS `progress()` to grow Tailwind text tokens from 100% at
20rem viewport width to 112.5% at 90rem, clamped outside that range. Rem units
preserve browser font preferences; root font size and spacing tokens are unchanged.
Arbitrary fixed font sizes are intentionally outside the experiment.
Unsupported browsers retain the normal typography through `@supports`.

The browser preference is device-wide, including across sign-ins, and syncs across
tabs. If storage is blocked, the switch still applies for the current page.

To remove:

1. Remove the fluidText import and `initializeFluidText()` call from `src/main.tsx`.
2. Remove the FluidTextControl import and `<FluidTextControl />` from
   `src/components/SettingsView.tsx`.
3. Delete this folder. The unused `cc.experimental.fluid-text.v1` storage entry
   is inert; no account schema, migration, or typography rollback is needed.
