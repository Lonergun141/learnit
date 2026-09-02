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
    <ErrorState
      icon={<TriangleAlert size={20} />}
      title="This page could not be loaded"
      description="Nothing you have saved was lost. Try again, and if it keeps happening the reference below identifies this failure."
      digest={error.digest}
      action={<Button onClick={() => retry()}>Try again</Button>}
    />
  );
}
