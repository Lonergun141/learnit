"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-6 py-20 sm:px-10 lg:px-14">
      <ErrorState
        icon={<TriangleAlert size={18} />}
        title="This page could not be loaded"
        description="Nothing you saved was lost. Try again."
        digest={error.digest}
        action={<Button onClick={() => retry()}>Try again</Button>}
      />
    </div>
  );
}
