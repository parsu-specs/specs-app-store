# No borders experiment

Off by default. Makes CSS borders transparent, preserving layout dimensions,
shadows, and keyboard focus outlines. Works independently of the other experiments.
The choice is saved on this device and syncs across tabs. When storage is blocked,
it still applies for the current page.

To remove, delete the noBorders import and `initializeNoBorders()` call in
`src/main.tsx`, delete the NoBordersControl import and `<NoBordersControl />` in
`src/components/SettingsView.tsx`, then delete this folder. The unused
`cc.experimental.no-borders.v1` storage entry is inert.
