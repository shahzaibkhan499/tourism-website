import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title = "کوئی ڈیٹا نہیں ملا",
  description = "ابھی یہاں کچھ نہیں ہے۔",
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center", className)}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 dir="auto" className="text-lg font-semibold">{title}</h3>
      <p dir="auto" className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && (
        <Button className="mt-4" onClick={onAction} asChild={Boolean(actionHref)}>
          {actionHref ? <a href={actionHref}>{actionLabel}</a> : <>{actionLabel}</>}
        </Button>
      )}
    </div>
  );
}
