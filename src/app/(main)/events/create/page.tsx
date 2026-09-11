import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import EventForm from "./event-form";

export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <EventForm />
    </Suspense>
  );
}
