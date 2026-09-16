import { useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { watchTargetFn } from "@/lib/alerts.functions";
import { Button } from "@/components/ui/button";

export function WatchButton({
  watchType,
  value,
  label,
  listingKey,
  className,
  variant = "outline",
}: {
  watchType: "building" | "neighborhood" | "property";
  value: string;
  label: string;
  listingKey?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}) {
  const watch = useServerFn(watchTargetFn);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function act() {
    setBusy(true);
    try {
      await watch({ data: { watchType, value, ...(listingKey ? { listingKey } : {}) } });
      setDone(true);
      toast.success(`Watching ${label}. We'll flag every new listing and price move.`);
    } catch {
      toast.error("Sign in to watch and get alerts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant={variant} className={className} disabled={busy || done} onClick={act}>
      <Bell className="mr-2 h-4 w-4" />
      {done ? "Watching" : busy ? "Setting up…" : `Watch ${watchType}`}
    </Button>
  );
}
