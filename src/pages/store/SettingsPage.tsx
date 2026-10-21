import SettingsView from "../../components/SettingsView";
import type { StoreController } from "./useStoreController";
import { cacheHasPassword } from "../../utils/viewerCache";

type Props = Pick<
  StoreController,
  "hasPassword" | "myProfile" | "setHasPassword" | "setProfileTick" | "setPwSnoozed" | "user"
>;

export default function SettingsPage({
  hasPassword,
  myProfile,
  setHasPassword,
  setProfileTick,
  setPwSnoozed,
  user,
}: Props) {
  return (
    <>
      <section>
        <SettingsView
          profile={myProfile}
          onChanged={() => setProfileTick((t) => t + 1)}
          hasPassword={hasPassword}
          onPasswordUpdated={() => {
            if (user) cacheHasPassword(user.id, true);
            setHasPassword(true);
            setPwSnoozed(false);
            try {
              if (user) localStorage.removeItem(`cc.pw_nudge.v1:${user.id}`);
            } catch {
              // Ignore.
            }
          }}
        />
      </section>
    </>
  );
}
