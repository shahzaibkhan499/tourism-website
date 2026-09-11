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
      <h1 className="mt-4 text-2xl font-bold">کچھ غلط ہو گیا</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        معذرت کے ساتھ، تکنیکی مسئلہ آ گیا ہے۔ دوبارہ کوشش کریں۔
      </p>
      <Button className="mt-6" onClick={reset}>
        دوبارہ کوشش کریں
      </Button>
    </div>
  );
}
