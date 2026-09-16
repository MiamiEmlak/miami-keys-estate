import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Button> & { tone?: "gold" | "ink" | "ghost" };

export function LuxuryButton({ tone = "gold", className, ...props }: Props) {
  return (
    <Button
      {...props}
      variant={tone === "ghost" ? "outline" : "default"}
      className={cn(
        "rounded-sm px-6 text-[11px] uppercase tracking-[0.18em]",
        tone === "gold" && "bg-accent text-accent-foreground hover:bg-accent/90",
        tone === "ink" && "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    />
  );
}
