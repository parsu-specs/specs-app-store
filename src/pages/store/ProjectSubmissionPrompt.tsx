import { Plus, RocketLaunch, X } from "@phosphor-icons/react";
import { Button } from "../../components/Button";

type Props = {
  hasSubmittedProject: boolean;
  showForm: boolean;
  onSubmit: () => void;
  onDismiss?: () => void;
  className?: string;
};

export default function ProjectSubmissionPrompt({
  hasSubmittedProject,
  showForm,
  onSubmit,
  onDismiss,
  className = "",
}: Props) {
  return (
    <div
      className={`toon-card relative min-w-0 rounded-2xl bg-secondary p-4 text-foreground ${className}`}
    >
      <div className="flex items-start gap-2">
        <RocketLaunch size={22} weight="duotone" aria-hidden="true" className="shrink-0" />
        <h2 className="min-w-0 flex-1 text-base font-black leading-tight">
          {hasSubmittedProject ? "Share your next build" : "No projects submitted yet"}
        </h2>
        {onDismiss && (
          <Button
            variant="minimal"
            size="compact-icon"
            onClick={onDismiss}
            aria-label="Dismiss project submission prompt"
            className="-mr-2 -mt-2 shrink-0"
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </Button>
        )}
      </div>
      <p className="mt-2 text-sm font-bold text-body">
        {hasSubmittedProject
          ? "Share something new with the community."
          : "Share your build and get community feedback."}
      </p>
      <Button
        variant="primary"
        size="small"
        onClick={onSubmit}
        aria-haspopup="dialog"
        aria-expanded={showForm}
        aria-controls="submit-project"
        className="mt-3"
      >
        <Plus size={18} weight="bold" aria-hidden="true" />
        {hasSubmittedProject ? "Submit project" : "Submit first project"}
      </Button>
    </div>
  );
}
