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
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Gate held</p>
      <h1 className="mt-3 font-serif text-3xl text-brand-gold">
        BLACKGATE could not open this screen
      </h1>
      <p className="mt-3 max-w-md text-sm text-brand-white/70">
        This screen hit an unexpected error. Try again, or return to the public
        intake door.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" variant="amber" onClick={() => reset()}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <a href="/">Public intake</a>
        </Button>
      </div>
    </div>
  );
}
