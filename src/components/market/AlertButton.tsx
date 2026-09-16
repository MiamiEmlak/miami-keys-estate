import { useState } from "react";
import { MailPlus } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createAlertFn } from "@/lib/alerts.functions";
import { Button } from "@/components/ui/button";

export function AlertButton({
  name,
  criteria,
  className,
  children,
}: {
  name: string;
  criteria: Record<string, string>;
  className?: string;
  children?: React.ReactNode;
}) {
  const create = useServerFn(createAlertFn);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function act() {
    setBusy(true);
    try {
      await create({ data: { name, criteria, frequency: "daily" } });
      setDone(true);
      toast.success("Alert created — new matches land in your inbox daily.");
    } catch {
      toast.error("Sign in to set up listing alerts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="secondary" className={className} disabled={busy || done} onClick={act}>
      <MailPlus className="mr-2 h-4 w-4" />
      {done ? "Alerts on" : busy ? "Saving…" : (children ?? "Get new listing alerts")}
    </Button>
  );
}
