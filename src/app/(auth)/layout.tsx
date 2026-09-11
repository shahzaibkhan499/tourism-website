import { TreePine } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pattern-islamic flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 via-white to-emerald-50 px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <TreePine className="h-6 w-6" />
        </div>
        <span className="text-xl font-bold">
          Digital <span className="text-emerald-600">Khandaan</span>
        </span>
      </Link>
      {children}
    </div>
  );
}
