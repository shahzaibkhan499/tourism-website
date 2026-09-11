"use client";

import type { LucideIcon } from "lucide-react";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SectionCardProps {
  id?: string;
  icon: LucideIcon;
  iconClass?: string;
  title: string;
  titleUrdu: string;
  description?: string;
  summary?: string;
  onEdit: () => void;
  children?: React.ReactNode;
}

export function SectionCard({
  id,
  icon: Icon,
  iconClass,
  title,
  titleUrdu,
  description,
  summary,
  onEdit,
  children,
}: SectionCardProps) {
  return (
    <Card id={id} className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="min-w-0">
          <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
            <Icon className={`h-4 w-4 ${iconClass ?? "text-emerald-600"}`} />
            <span>{title}</span>
            <span dir="rtl" className="font-urdu text-sm text-emerald-700">{titleUrdu}</span>
          </CardTitle>
          {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
        </div>
        <Button size="sm" variant="outline" onClick={onEdit} className="shrink-0">
          <Pencil className="mr-1 h-3.5 w-3.5" />
          ترمیم
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        {summary ? (
          <p className="text-sm text-gray-600">{summary}</p>
        ) : (
          <p className="text-sm text-gray-400">ابھی نہیں بھرا گیا</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
