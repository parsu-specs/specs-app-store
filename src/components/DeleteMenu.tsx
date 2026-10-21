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
      className="w-40 p-1"
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
          className="rounded-full p-1 text-muted hover:bg-background hover:text-foreground"
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
        className="text-danger"
      >
        <Trash size={16} aria-hidden="true" />
        {pending ? "Deleting…" : "Delete"}
      </Button>
      {error && (
        <p role="alert" className="px-3 py-2 text-xs font-bold">
          {error}
        </p>
      )}
    </Popover>
  );
}
