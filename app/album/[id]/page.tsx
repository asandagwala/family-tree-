import { Suspense } from "react";
import { GatheringView } from "@/components/gathering-view";

export const metadata = { title: "Gathering · Imvelaphi" };

// The id is only known at request time, so the page renders inside Suspense.
// Every page waits for the sign-in check, so there is no instant shell to validate.
export const instant = false;

export default function GatheringPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-6 h-96 max-w-6xl animate-pulse rounded-[2rem] bg-mist sm:mx-8" />}>
      <GatheringView />
    </Suspense>
  );
}
