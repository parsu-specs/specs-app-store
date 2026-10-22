import { Button } from "./Button";
import React from "react";
import type { Mention, Profile } from "../data/types";
import { mentionPattern } from "../utils/mentions";

type MentionTextProps = {
  text: string;
  profiles: Profile[];
  mentions?: Mention[];
  onOpenProfile: (profileId: string) => void;
};

/** Saved labels retain their original text; links always use the saved user ID. */
export default function MentionText({ text, profiles, mentions, onOpenProfile }: MentionTextProps) {
  const bindings = mentions ?? [];
  const pattern = mentionPattern(bindings.map((m) => m.name));
  if (!pattern) return <>{text}</>;
  const byName = new Map(bindings.map((m) => [m.name.toLowerCase(), m]));
  const byId = new Map(profiles.map((p) => [p.id, p]));
  return (
    <>
      {text.split(pattern).map((part, i) => {
        const mention = part.startsWith("@") ? byName.get(part.slice(1).toLowerCase()) : undefined;
        if (!mention) return <React.Fragment key={i}>{part}</React.Fragment>;
        const profile = byId.get(mention.userId);
        // A deleted account must never redirect to a new owner of its former name.
        if (!profile) return <React.Fragment key={i}>{part}</React.Fragment>;
        return (
          <Button
            variant="plain"
            key={i}
            type="button"
            onClick={() => onOpenProfile(mention.userId)}
            title={`View ${profile.name}'s profile`}
            className="inline cursor-pointer border-0 bg-transparent p-0 font-bold text-primary hover:opacity-80"
          >
            {part}
          </Button>
        );
      })}
    </>
  );
}
