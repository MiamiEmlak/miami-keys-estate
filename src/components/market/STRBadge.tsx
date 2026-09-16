import { KeyRound } from "lucide-react";

export function STRBadge({ friendly, className }: { friendly: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] uppercase tracking-widest ${
        friendly
          ? "border-accent/40 bg-accent/10 text-accent-foreground"
          : "border-border bg-secondary text-muted-foreground"
      } ${className ?? ""}`}
    >
      <KeyRound className="h-3 w-3" />
      {friendly ? "STR friendly" : "No short-term rentals"}
    </span>
  );
}
