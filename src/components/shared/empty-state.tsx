import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title = "Koi data nahi mila",
  description = "Abhi yahan kuch nahi hai.",
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center", className)}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && (
        <Button className="mt-4" onClick={onAction} asChild={Boolean(actionHref)}>
          {actionHref ? <a href={actionHref}>{actionLabel}</a> : <>{actionLabel}</>}
        </Button>
      )}
    </div>
  );
}
