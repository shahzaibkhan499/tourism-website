"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <div className="text-5xl">😢</div>
      <h1 className="mt-4 text-2xl font-bold">Kuch ghalat ho gaya</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        Maazrat ke saath, technical masla aa gaya hai. Dobara koshish karein.
      </p>
      <Button className="mt-6" onClick={reset}>
        Dobara Koshish Karein
      </Button>
    </div>
  );
}
