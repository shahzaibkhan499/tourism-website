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
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
          {titleUrdu && <span className="mr-2 text-muted-foreground font-urdu">{titleUrdu}</span>}
        </h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
