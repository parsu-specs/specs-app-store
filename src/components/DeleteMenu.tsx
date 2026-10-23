import { userFacingError } from "../utils/userFacingError";
import { useId, useState } from "react";
import { DotsThreeVertical, Trash } from "@phosphor-icons/react";
import { Button } from "./Button";
import Popover from "./Popover";

export default function DeleteMenu({
  label,
  onDelete,
}: {
  label: string;
  onDelete: () => Promise<void>;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onDelete();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Popover
      id={id}
      label={label}
      open={open}
      onOpenChange={setOpen}
      className="w-52 gap-2 p-3"
      trigger={
        <Button
          variant="plain"
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={() => {
            setError(null);
            setOpen(!open);
          }}
          className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-background hover:text-foreground"
        >
          <DotsThreeVertical size={20} weight="bold" aria-hidden="true" />
        </Button>
      }
    >
      <Button
        variant="menu"
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={() => void remove()}
        className="min-h-11 justify-between! text-danger hover:bg-danger/10"
      >
        <span>{pending ? "Deleting…" : "Delete"}</span>
        <Trash size={20} aria-hidden="true" />
      </Button>
      {error && (
        <p
          role="alert"
          className="border-t-2 border-dashed border-divider/60 px-3 py-2 text-xs font-bold"
        >
          {userFacingError(error)}
        </p>
      )}
    </Popover>
  );
}
