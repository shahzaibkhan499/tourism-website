import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  titleUrdu?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, titleUrdu, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-2xl font-bold tracking-tight sm:text-3xl">
          <span className="whitespace-nowrap">{title}</span>
          {titleUrdu && (
            <span dir="rtl" className="font-urdu text-lg leading-relaxed text-emerald-700 sm:text-2xl">
              {titleUrdu}
            </span>
          )}
        </h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
