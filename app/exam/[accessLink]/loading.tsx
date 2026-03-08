import { Skeleton } from "@/components/ui/skeleton";

export default function ExamAccessLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Exam info card */}
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg mt-4" />
        </div>
      </div>
    </div>
  );
}
