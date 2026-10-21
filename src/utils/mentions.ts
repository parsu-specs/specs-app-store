import type { Profile } from "../data/types";

/** The @query immediately before the caret; supports full display names. */
export function findMentionQuery(text: string, cursor: number) {
  const match = /(?:^|[\s(])@([^@\r\n]*)$/u.exec(text.slice(0, cursor));
  return match ? { query: match[1], start: cursor - match[1].length - 1 } : null;
}

export function suggestMentionProfiles(profiles: Profile[], query: string): Profile[] {
  const q = query.trim().toLocaleLowerCase();
  const unique = new Map<string, Profile>();
  for (const profile of profiles) {
    const key = profile.name.trim().toLocaleLowerCase();
    if (key && !unique.has(key)) unique.set(key, profile);
  }
  const score = (profile: Profile) => {
    const name = profile.name.toLocaleLowerCase();
    return name === q ? 0 : name.startsWith(q) ? 1 : name.includes(q) ? 2 : 3;
  };
  return [...unique.values()]
    .filter((profile) => !q || score(profile) < 3)
    .sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name))
    .slice(0, 8);
}

/** Extract collaborator profile ids from @Name mentions (exact name match). */
export function extractMentionIds(text: string, profiles: Profile[]): string[] {
  const byLower = new Map<string, Profile>();
  for (const p of profiles) {
    const key = p.name.toLowerCase();
    if (!byLower.has(key)) byLower.set(key, p);
  }
  const seen = new Set<string>();
  const ids: string[] = [];
  const re = /@([A-Za-z][A-Za-z .'-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const token = m[1].replace(/[ .'-]+$/, "").trim();
    if (!token) continue;
    const hit = byLower.get(token.toLowerCase());
    if (hit && !seen.has(hit.id)) {
      seen.add(hit.id);
      ids.push(hit.id);
    }
  }
  return ids;
}
