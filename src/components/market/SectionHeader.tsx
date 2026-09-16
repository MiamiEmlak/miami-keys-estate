export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-6 ${className ?? ""}`}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent-foreground">{eyebrow}</p>
        )}
        <h2 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">{title}</h2>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
