# Incident runbook — CodeCanvas (one page)

## Roll back a bad release (frontend, ~2 min)

1. Vercel → specs-app-store → Deployments → find last good → ⋯ → **Redeploy**
   (or Instant Rollback). Confirm the live URL loads `/landing` unauthenticated.
2. If the bad release included a migration, the frontend rollback does NOT undo
   DB changes — see Restore below. Forward-fix preferred over `git revert`
   for migrations (every file is re-runnable by design).

## Back up / restore (Supabase Postgres)

```bash
# Back up (run before every migration, keep 30 days)
pg_dump "$SUPABASE_DB_URL" -Fc -f specs-backup-$(date +%F).dump

# Restore to a FRESH project (never over prod blindly), then repoint env
pg_restore -d "$RESTORE_DB_URL" specs-backup-<date>.dump
```

PITR is available on paid tiers only — know your plan before you need it.
Free tier: the dump above IS your backup. Test-restore quarterly.

## First hour of a breach or outage

| Min | Action |
|---|---|
| 0–10 | **Detect:** check `admin_audit` for `action='denied'` spikes (probing), Vercel Analytics for 5xx, Supabase Auth logs for failed logins. Declare incident + owner. |
| 10–25 | **Contain:** suspected account → remove its `admins` row; suspected key leak → rotate anon key / OAuth secret in dashboards, update Vercel env, redeploy; active abuse → enable Supabase Auth CAPTCHA + rate limits. |
| 25–45 | **Eradicate:** delete forged rows (they carry the attacker's `author_id`/`user_id`); revoke sessions (Supabase → user → Sign out); remove malicious OAuth grants. |
| 45–60 | **Recover:** redeploy known-good build; re-run smoke test (signup → post → vote → signout); restore from dump only if data was destroyed. |
| After | **Learn:** write the 5-line postmortem (what, impact, root cause, fix, prevention) and turn it into a checklist item here. |

## Alerts to configure (Supabase + Vercel dashboards)

- `admin_audit` `denied` rows > 5 / 10 min (probing).
- `saveResource` 500s / audit-write failures (tamper or outage).
- Supabase Auth failed-login spike; Postgres 5xx spike; Vercel 5xx spike.
- Review `admin_audit` tail weekly even with no alerts.

Contacts: <owner name + phone>. On-call rotation: <link>.
