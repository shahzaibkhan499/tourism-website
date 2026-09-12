"use client";

import { useEffect, useRef } from "react";
import { Baby, HeartHandshake, Pencil, Trash2, UserPlus } from "lucide-react";
import { useTreeStore } from "@/stores/tree-store";

// ============================================================
// TREE CONTEXT MENU — right-click actions:
// Edit, Add Child, Add Spouse, Add Parent, Delete.
// ============================================================

interface TreeContextMenuProps {
  canEdit: boolean;
  onEdit: (memberId: string) => void;
  onAddChild: (memberId: string) => void;
  onAddSpouse: (memberId: string) => void;
  onAddParent: (memberId: string) => void;
  onDelete: (memberId: string) => void;
}

export function TreeContextMenu({ canEdit, onEdit, onAddChild, onAddSpouse, onAddParent, onDelete }: TreeContextMenuProps) {
  const contextMenu = useTreeStore((s) => s.contextMenu);
  const close = useTreeStore((s) => s.closeContextMenu);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!contextMenu.memberId) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu.memberId, close]);

  if (!contextMenu.memberId || !canEdit) return null;

  const items = [
    { icon: Pencil, label: "Edit — ترمیم کریں", onClick: () => onEdit(contextMenu.memberId!) },
    { icon: UserPlus, label: "Add Parent — والدین شامل کریں", onClick: () => onAddParent(contextMenu.memberId!) },
    { icon: HeartHandshake, label: "Add Spouse — شریک حیات شامل کریں", onClick: () => onAddSpouse(contextMenu.memberId!) },
    { icon: Baby, label: "Add Child — بچہ شامل کریں", onClick: () => onAddChild(contextMenu.memberId!) },
    { icon: Trash2, label: "Delete — ڈیلیٹ کریں", danger: true, onClick: () => onDelete(contextMenu.memberId!) },
  ];

  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(contextMenu.x, typeof window !== "undefined" ? window.innerWidth - 190 : 0),
    top: Math.min(contextMenu.y, typeof window !== "undefined" ? window.innerHeight - 230 : 0),
    zIndex: 60,
  };

  return (
    <div ref={ref} style={style} className="w-44 rounded-xl border bg-white p-1 shadow-xl">
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={() => {
            it.onClick();
            close();
          }}
          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
            it.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-emerald-50"
          }`}
        >
          <it.icon className="h-4 w-4" />
          {it.label}
        </button>
      ))}
    </div>
  );
}
