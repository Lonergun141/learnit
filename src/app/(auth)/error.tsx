"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function AuthError({
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
      icon={<TriangleAlert size={18} />}
      title="Sign-in is unavailable"
      description="Try again in a moment."
      digest={error.digest}
      action={<Button onClick={() => retry()}>Try again</Button>}
    />
  );
}
