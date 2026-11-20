import { Suspense } from "react";
import { PersonProfile } from "@/components/people/person-profile";

export const metadata = { title: "Profile · Imvelaphi" };

// The id is only known at request time, so the profile renders inside Suspense.
// Every page waits for the sign-in check, so there is no instant shell to validate.
export const instant = false;

export default function PersonPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-6 h-80 max-w-6xl animate-pulse rounded-[2rem] bg-mist sm:mx-8" />}>
      <PersonProfile />
    </Suspense>
  );
}
