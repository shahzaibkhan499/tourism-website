import Link from "next/link";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
        <TreePine className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-6xl font-extrabold text-gray-900">404</h1>
      <h2 className="mt-2 text-2xl font-semibold">Yeh page nahi mila</h2>
      <p className="mt-3 max-w-md text-gray-600">
        Jo page aap dhond rahe hain woh mojood nahi hai ya hata diya gaya hai.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">Wapis Home Par</Link>
      </Button>
    </div>
  );
}
