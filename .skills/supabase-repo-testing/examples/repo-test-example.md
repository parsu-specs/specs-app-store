# Example: mocking AppRepo

```ts
import { describe, it, expect, vi } from 'vitest';

// stub at the supabase boundary
const fromMock = vi.fn();
vi.mock('../client', () => ({
  supabase: { from: (...a: any[]) => fromMock(...a) },
}));

import { AppRepo } from '../AppRepo';

describe('AppRepo.list()', () => {
  it('returns apps sorted by rating', async () => {
    fromMock.mockReturnValue({
      select: () => ({ order: () => ({ data: [{ id: '1', rating: 5 }], error: null }) }),
    });
    const apps = await AppRepo.list();
    expect(apps[0].rating).toBe(5);
  });

  it('returns [] on empty data', async () => {
    fromMock.mockReturnValue({
      select: () => ({ order: () => ({ data: null, error: null }) }),
    });
    expect(await AppRepo.list()).toEqual([]);
  });
});
```

Apply the same shape to ProfileRepo (add an auth-error case) and AuthRepo
(mock `supabase.auth.getSession` instead of `from`).
