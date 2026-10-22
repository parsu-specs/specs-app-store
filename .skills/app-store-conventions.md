# App Store Specs — Working Conventions

## Structure
- The repo is a Vite + React + TypeScript app.
- UI domain operations use AuthRepo / AppRepo / ProfileRepo from src/data/repositories.ts.
- Never import supabase directly from components — always go through the repositories.

## Style
- Components: named exports, one component per file.
- Prefer ph-level icons (@phosphor-icons/react), weight="duotone" for primary UI.
- Colors and spacing come from the design tokens — no hard-coded hex.

## Before finishing a task
- Run: npm run build (must pass with zero TS errors).
- Check docs/ui-audit.md if touching layout components.