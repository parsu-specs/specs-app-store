# Supabase Repo Testing Playbook

How to test the repository layer (AuthRepo / AppRepo / ProfileRepo) of app-store-specs
without ever hitting the real Supabase backend.

## Rules

1. NEVER import the supabase client directly in tests — always go through the repo classes
   (that is the whole point of the repository layer).
2. Mock at the repo boundary: stub the `supabase.from(...)` chain, not fetch/XHR.
3. Every repo method gets at least three cases: happy path, empty result, auth error.
4. Use vitest with @testing-library/react for component tests.

## Conventions

- Test files live next to the code: `src/repositories/__tests__/AppRepo.test.ts`
- Name tests after behavior: "returns apps sorted by rating" — not "test1" / "works".
- Assert on the returned domain objects, never on raw supabase rows.
- After writing tests, run `npm run build` — type errors in tests count as failures.
