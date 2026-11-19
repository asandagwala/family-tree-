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
  }).index("by_lastName_and_firstName", ["lastName", "firstName"]),

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

  // App-wide settings; a single row.
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
  }),

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
