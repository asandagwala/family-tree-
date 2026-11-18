import { initials, initialsTone, INITIALS_TEXT, type Person } from "@/lib/people";

/** Round portrait: the person's photo, or their initials on a soft green field. */
export function Portrait({
  person,
  size = 48,
  className = "",
  ring = true,
}: {
  person: Pick<Person, "_id" | "firstName" | "lastName" | "photoUrl" | "deathDate">;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const deceased = !!person.deathDate;
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full ${
        ring ? "ring-2 ring-offset-2 ring-offset-card " + (deceased ? "ring-silver" : "ring-sage") : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {person.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Convex storage URLs are dynamic
        <img
          src={person.photoUrl}
          alt=""
          className={`h-full w-full object-cover ${deceased ? "grayscale" : ""}`}
        />
      ) : (
        <span
          className="grid h-full w-full place-items-center font-display font-semibold tracking-wide"
          style={{ fontSize: size * 0.38, background: initialsTone(person._id), color: INITIALS_TEXT }}
        >
          {initials(person)}
        </span>
      )}
    </span>
  );
}
