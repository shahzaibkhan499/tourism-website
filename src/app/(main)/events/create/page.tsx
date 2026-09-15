"use client";

/**
 * Round 10 — Create Event flow:
 *  1) /events/create            → categorized grid of event types (Fix 1)
 *  2) /events/create?type=DEATH → the dynamic form for that type (Fix 2)
 *  3) /events/create?edit={id}  → loads the event, then its type's form
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_TYPES, getEventTypeInfo } from "@/lib/constants";
import { EventCategoryGrid } from "./event-category-grid";
import DeathEventForm from "./death-form";
import BirthEventForm from "./birth-form";
import GenericEventForm from "./generic-form";

/** Resolves the event type in edit mode before rendering the right form. */
function EditRouter({ editId }: { editId: string }) {
  const [type, setType] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/events/${editId}`)
      .then((r) => r.json())
      .then((ev) => {
        if (cancelled) return;
        if (ev.error) {
          setFailed(true);
          return;
        }
        setType(ev.type);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [editId]);

  if (failed) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        ایونٹ نہیں ملا — Event not found
      </div>
    );
  }
  if (!type) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton className="mb-4 h-16 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  if (type === "DEATH") return <DeathEventForm />;
  if (type === "BIRTH") return <BirthEventForm />;
  return <GenericEventForm type={type} />;
}

function CreateEventFlow() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const editId = searchParams.get("edit");

  if (editId) {
    return <EditRouter editId={editId} />;
  }

  // Unknown / legacy type → show the grid
  const activeType = type && EVENT_VALUES.has(type) ? type : null;
  if (!activeType) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Create Event"
          titleUrdu="نیا ایونٹ بنائیں"
          description="پہلے تقریب کی قسم منتخب کریں — پہلے event type choose karein, phir us ka dynamic form khulega۔"
        />
        <EventCategoryGrid />
      </div>
    );
  }

  if (activeType === "DEATH") return <DeathEventForm />;
  if (activeType === "BIRTH") return <BirthEventForm />;
  return <GenericEventForm type={activeType} />;
}

const EVENT_VALUES: Set<string> = new Set(EVENT_TYPES.map((t) => t.value));

export default function CreateEventPage() {
  return (
    <SuspenseWrap>
      <CreateEventFlow />
    </SuspenseWrap>
  );
}

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
