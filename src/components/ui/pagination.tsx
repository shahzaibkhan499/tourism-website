"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  hasMore: boolean;
  isLoading?: boolean;
  onNext: () => void;
  onPrev: () => void;
  pageInfo?: string;
}

export function Pagination({ hasMore, isLoading, onNext, onPrev, pageInfo }: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <span className="text-sm text-muted-foreground">{pageInfo || ""}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={isLoading}>
          <ChevronLeft className="h-4 w-4" />پچھلا</Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasMore || isLoading}>اگلا<ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
