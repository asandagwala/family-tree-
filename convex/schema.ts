import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const genderValidator = v.union(
  v.literal("female"),
  v.literal("male"),
  v.literal("other"),
  v.literal("unknown"),
);

export const gatheringKind = v.union(
  v.literal("wedding"),
  v.literal("umemulo"),
  v.literal("imbeleko"),
  v.literal("graduation"),
  v.literal("funeral"),
  v.literal("memorial"),
  v.literal("birthday"),
  v.literal("christmas"),
  v.literal("reunion"),
  v.literal("other"),
);

/** Editable fields of a person (the profile photo is set separately). */
export const personFields = {
  firstName: v.string(),
  lastName: v.string(),
  gender: genderValidator,
  // Free-form so a bare year ("1952") or a full date ("1952-03-14") both work.
  birthDate: v.optional(v.string()),
  deathDate: v.optional(v.string()),
  birthPlace: v.optional(v.string()),
  currentPlace: v.optional(v.string()),
  clanName: v.optional(v.string()), // isiduko
  occupation: v.optional(v.string()),
  notes: v.optional(v.string()), // their story
  // Ways to connect, shared with the family
  whatsapp: v.optional(v.string()), // phone number, e.g. +27 82 123 4567
  instagram: v.optional(v.string()), // handle
  facebook: v.optional(v.string()), // profile link or name
  tiktok: v.optional(v.string()), // handle
  linkedin: v.optional(v.string()), // profile link
};

export default defineSchema({
  people: defineTable({
    ...personFields,
    photoId: v.optional(v.id("_storage")),
    // The family whose tree this person is in (unset for the sample family).
    familyId: v.optional(v.id("families")),
    // true = part of the sample family people can explore; never shown in a real family's tree
    sample: v.optional(v.boolean()),
  })
    .index("by_lastName_and_firstName", ["lastName", "firstName"])
    .index("by_familyId", ["familyId"]),

  // One row per parent → child link. A child has at most two parents.
  parentLinks: defineTable({
    parentId: v.id("people"),
    childId: v.id("people"),
  })
    .index("by_parentId_and_childId", ["parentId", "childId"])
    .index("by_childId", ["childId"]),

  // Undirected partner/spouse link. Stored once; personA is the lower id.
  partnerships: defineTable({
    personA: v.id("people"),
    personB: v.id("people"),
  })
    .index("by_personA_and_personB", ["personA", "personB"])
    .index("by_personB", ["personB"]),

  // One per family using the app. Relatives join with its code.
  families: defineTable({
    name: v.string(), // the family name, e.g. Rubuluza
    code: v.string(), // the family code, upper case, e.g. RUBULUZA-7KQ4MX
    clanName: v.optional(v.string()), // the family's isiduko
    clanPraise: v.optional(v.string()), // izithakazelo, as the family recites them
    whatsappGroupUrl: v.optional(v.string()), // family WhatsApp group invite link
  }).index("by_code", ["code"]),

  // Signed-in accounts (emails and passwords live in the Convex Auth components).
  users: defineTable({
    familyId: v.optional(v.id("families")), // set once they join or start a family
    member: v.optional(v.boolean()), // before families: entered the one family code (migrated away)
    name: v.optional(v.string()), // from Google
    email: v.optional(v.string()), // from Google; email sign-ins keep theirs in the auth component
  }),

  // Before families: the one family's details (migrated into families).
  settings: defineTable({
    familyName: v.optional(v.string()),
    clanName: v.optional(v.string()), // the family's isiduko
    clanPraise: v.optional(v.string()), // izithakazelo, as the family recites them
    whatsappGroupUrl: v.optional(v.string()), // family WhatsApp group invite link
  }),

  // Family album: one gathering per function or event.
  gatherings: defineTable({
    title: v.string(),
    kind: gatheringKind,
    date: v.optional(v.string()), // a year or a full date
    place: v.optional(v.string()),
    story: v.optional(v.string()),
    coverId: v.optional(v.id("_storage")),
    // Who was there. Kept small (capped in the mutations).
    peopleIds: v.array(v.id("people")),
    familyId: v.optional(v.id("families")),
    sample: v.optional(v.boolean()),
  }).index("by_familyId", ["familyId"]),

  gatheringPhotos: defineTable({
    gatheringId: v.id("gatherings"),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
  }).index("by_gatheringId", ["gatheringId"]),

  // Photo gallery for a person.
  photos: defineTable({
    personId: v.id("people"),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
  }).index("by_personId", ["personId"]),
});
