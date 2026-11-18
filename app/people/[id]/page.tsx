import { Suspense } from "react";
import { PersonProfile } from "@/components/person-profile";

export const metadata = { title: "Profile · Imvelaphi" };

// The id is only known at request time, so the profile renders inside Suspense.
export default function PersonPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-6 h-80 max-w-6xl animate-pulse rounded-[2rem] bg-mist sm:mx-8" />}>
      <PersonProfile />
    </Suspense>
  );
}
