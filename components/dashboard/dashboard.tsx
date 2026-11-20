"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFamily } from "@/lib/use-family";
import { PersonEditor } from "@/components/people/person-editor";
import { Welcome } from "@/components/home/welcome";
import { Hero } from "./hero";
import { BirthsByDecade } from "./births-by-decade";
import { UpcomingBirthdays } from "./upcoming-birthdays";
import { FeaturedStory } from "./featured-story";
import { ClanNames, Roots } from "./roots-and-clans";
import { StayConnected } from "./stay-connected";
import { MissingDetails } from "./missing-details";

export function Dashboard() {
  const family = useFamily();
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  if (family === undefined) return <DashboardSkeleton />;
  if (family.list.length === 0) return <Welcome />;

  return (
    <div>
      {/* The banner runs edge to edge; the cards below sit in the page column. */}
      <Hero family={family} onAdd={() => setAdding(true)} />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-5">
          <BirthsByDecade family={family} className="lg:col-span-3" />
          <UpcomingBirthdays family={family} className="lg:col-span-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <FeaturedStory family={family} className="lg:col-span-2" />
          <Roots family={family} />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <ClanNames family={family} />
          <StayConnected family={family} />
          <MissingDetails family={family} />
        </div>
      </div>
      {adding && (
        <PersonEditor
          mode={{ kind: "new" }}
          family={family}
          onClose={() => setAdding(false)}
          onSaved={(id) => router.push(`/people/${id}`)}
        />
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <div className="h-96 animate-pulse rounded-[2rem] bg-cream" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-[1.75rem] bg-mist" />
        ))}
      </div>
    </div>
  );
}
