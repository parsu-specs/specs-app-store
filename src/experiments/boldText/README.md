# Bold text experiment

Off by default. Increases inherited body text to 700 and remaps Tailwind weight
tokens to the existing 700/900 font faces. The heaviest text stays at 900.
Font sizes are unchanged, and fluid text can be toggled independently.
The browser preference is device-wide and syncs across tabs. If storage is
unavailable, the choice still works for the current page.

To remove:

1. Remove the boldText import and `initializeBoldText()` from `src/main.tsx`.
2. Remove the BoldTextControl import and `<BoldTextControl />` from
   `src/components/SettingsView.tsx`.
3. Delete this folder. The leftover `cc.experimental.bold-text.v1` storage entry
   is inert; no account migration or shared typography changes are needed.
