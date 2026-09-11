"use client";

import { Maximize, Minus, Plus, RotateCcw, Map as MapIcon, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTreeStore } from "@/stores/tree-store";
import type { LayoutDirection } from "@/types/tree";
import type { TreeViewerApi } from "@/components/tree/tree-viewer";
import { cn } from "@/lib/utils";

// ============================================================
// TREE CONTROLS — zoom, fit, layout direction switch, display
// toggles (names/photos/dates/males-first), legend + minimap.
// ============================================================

const DIRECTIONS: { value: LayoutDirection; label: string }[] = [
  { value: "TB", label: "Top → Bottom · اوپر سے نیچے" },
  { value: "BT", label: "Bottom → Top · نیچے سے اوپر" },
  { value: "LR", label: "Left → Right · بائیں سے دائیں" },
  { value: "RL", label: "Right → Left · دائیں سے بائیں" },
];

interface TreeControlsProps {
  viewerApi: React.RefObject<TreeViewerApi | null>;
}

export function TreeControls({ viewerApi }: TreeControlsProps) {
  const direction = useTreeStore((s) => s.direction);
  const setDirection = useTreeStore((s) => s.setDirection);
  const showNames = useTreeStore((s) => s.showNames);
  const showPhotos = useTreeStore((s) => s.showPhotos);
  const showDates = useTreeStore((s) => s.showDates);
  const malesFirst = useTreeStore((s) => s.malesFirst);
  const showMinimap = useTreeStore((s) => s.showMinimap);
  const showLegend = useTreeStore((s) => s.showLegend);
  const toggleNames = useTreeStore((s) => s.toggleNames);
  const togglePhotos = useTreeStore((s) => s.togglePhotos);
  const toggleDates = useTreeStore((s) => s.toggleDates);
  const toggleMalesFirst = useTreeStore((s) => s.toggleMalesFirst);
  const toggleMinimap = useTreeStore((s) => s.toggleMinimap);
  const toggleLegend = useTreeStore((s) => s.toggleLegend);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border bg-white p-1 shadow-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewerApi.current?.zoomIn()} aria-label="Zoom in">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewerApi.current?.zoomOut()} aria-label="Zoom out">
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewerApi.current?.fit()} aria-label="Fit view">
          <Maximize className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewerApi.current?.reset()} aria-label="Reset view">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <Select value={direction} onValueChange={(v) => setDirection(v as LayoutDirection)}>
        <SelectTrigger className="h-9 w-44 bg-white" aria-label="Layout direction">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DIRECTIONS.map((d) => (
            <SelectItem key={d.value} value={d.value}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-wrap items-center gap-1.5">
        <TogglePill label="نام" active={showNames} onClick={toggleNames} />
        <TogglePill label="تصاویر" active={showPhotos} onClick={togglePhotos} />
        <TogglePill label="تاریخیں" active={showDates} onClick={toggleDates} />
        <TogglePill label="پہلے مرد" active={malesFirst} onClick={toggleMalesFirst} />
        <Button
          variant={showMinimap ? "secondary" : "outline"}
          size="sm"
          className="h-8"
          onClick={toggleMinimap}
          aria-label="Toggle minimap"
        >
          <MapIcon className="mr-1 h-3.5 w-3.5" />
          نقشہ
        </Button>
        <Button
          variant={showLegend ? "secondary" : "outline"}
          size="sm"
          className="h-8"
          onClick={toggleLegend}
          aria-label="Toggle legend"
        >
          <BookOpen className="mr-1 h-3.5 w-3.5" />
          رہنما
        </Button>
      </div>
    </div>
  );
}

function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-lg border px-3 text-xs font-medium transition-colors",
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      )}
    >
      {label}
    </button>
  );
}
