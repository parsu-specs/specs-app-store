import ProjectView from "../../components/ProjectView";
import { ROUTES } from "../routes";
import type { StoreController } from "./useStoreController";

type Props = Pick<
  StoreController,
  | "loadApps"
  | "openProfile"
  | "profilesLookup"
  | "projectEdit"
  | "projectTrophies"
  | "selectedAppId"
  | "setProjectEdit"
  | "setSelectedAppId"
  | "setView"
  | "trophies"
  | "user"
>;

export default function ProjectPage({
  loadApps,
  openProfile,
  profilesLookup,
  projectEdit,
  projectTrophies,
  selectedAppId,
  setProjectEdit,
  setSelectedAppId,
  setView,
  trophies,
  user,
}: Props) {
  return (
    <>
      {selectedAppId && (
        <section>
          <ProjectView
            key={`${selectedAppId}:${projectEdit}`}
            appId={selectedAppId}
            currentUser={user ?? null}
            profiles={profilesLookup}
            startEditing={projectEdit}
            onBack={() => {
              window.history.pushState({}, "", ROUTES.discover);
              setView("discover");
              setSelectedAppId(null);
              setProjectEdit(false);
            }}
            onOpenProfile={openProfile}
            trophies={trophies}
            projectTrophies={projectTrophies}
            onChanged={() => void loadApps()}
            onDeleted={() => {
              window.history.pushState({}, "", ROUTES.discover);
              setView("discover");
              setSelectedAppId(null);
              setProjectEdit(false);
              void loadApps();
            }}
          />
        </section>
      )}
    </>
  );
}
