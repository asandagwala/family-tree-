import type { Doc } from "@/convex/_generated/dataModel";

export type GatheringKind = Doc<"gatherings">["kind"];

export const gatheringKindLabel: Record<GatheringKind, string> = {
  wedding: "Wedding",
  umemulo: "Umemulo",
  imbeleko: "Imbeleko",
  graduation: "Graduation",
  birthday: "Birthday",
  christmas: "Christmas",
  reunion: "Reunion",
  funeral: "Funeral",
  memorial: "Memorial",
  other: "Gathering",
};

export const GATHERING_KINDS = Object.keys(gatheringKindLabel) as GatheringKind[];
