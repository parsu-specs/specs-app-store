import type { ProfileRepo } from "../data/repositories";

/** Check availability before asking the user to release their current name. */
export async function confirmDisplayNameChange(
  repo: ProfileRepo,
  profile: { id: string; name: string },
  nextName: string,
  confirm: (message: string) => boolean | Promise<boolean>,
): Promise<boolean> {
  const name = nextName.trim();
  if (!name) throw new Error("Display name is required.");
  if (name.length > 40) throw new Error("Keep your name under 40 characters.");
  if (name === profile.name) return true;

  const existing = await repo.getProfileByName(name);
  if (existing && existing.id !== profile.id) {
    throw new Error("That display name is already taken. Try another.");
  }
  if (name.toLowerCase() === profile.name.trim().toLowerCase()) return true;

  return confirm(
    `Change your display name to “${name}”? Your current display name, “${profile.name}”, will become available for others to take.`,
  );
}
