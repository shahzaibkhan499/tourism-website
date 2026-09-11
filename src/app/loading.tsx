import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={36} />
        <p className="text-sm text-gray-500">لوڈ ہو رہا ہے...</p>
      </div>
    </div>
  );
}
