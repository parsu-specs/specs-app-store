import { Button } from "./Button";
import React from "react";
import type { Profile } from "../data/types";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type MentionTextProps = {
  text: string;
  profiles: Profile[];
  onOpenProfile: (profileId: string) => void;
};

/** Renders @Developer mentions as tappable profile links. Unknown names stay plain. */
export default function MentionText({ text, profiles, onOpenProfile }: MentionTextProps) {
  const names = profiles
    .map((p) => p.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!names.length || !text.includes("@")) return <>{text}</>;
  const byLower = new Map(profiles.map((p) => [p.name.toLowerCase(), p]));
  const parts = text.split(
    new RegExp(
      `(?<![\\p{L}\\p{N}_@])(@(?:${names.map(escapeRegExp).join("|")}))(?![\\p{L}\\p{N}_])`,
      "giu",
    ),
  );
  return (
    <>
      {parts.map((part, i) => {
        const hit = part.startsWith("@") ? byLower.get(part.slice(1).toLowerCase()) : undefined;
        if (!hit) return <React.Fragment key={i}>{part}</React.Fragment>;
        return (
          <Button
            variant="plain"
            key={i}
            type="button"
            onClick={() => onOpenProfile(hit.id)}
            title={`View ${hit.name}'s profile`}
            className="inline cursor-pointer border-0 bg-transparent p-0 font-bold text-primary hover:opacity-80"
          >
            @{hit.name}
          </Button>
        );
      })}
    </>
  );
}
