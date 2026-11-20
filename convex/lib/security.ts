import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx, MutationCtx } from "../_generated/server";

// ---------- Sizes ----------

/**
 * The longest each typed field may be. Generous for real use, but small enough
 * that nobody can fill the database (or the assistant's prompt) with junk.
 */
export const MAX_LENGTH = {
  name: 60, // first name, surname, family name, clan name
  place: 100,
  date: 40, // free-form: "1952", "1952-03-14", "about 1950"
  occupation: 100,
  story: 5000, // a person's notes, a gathering's story, izithakazelo
  contact: 200, // phone number, social handle or profile link
  title: 120, // a gathering's name
  caption: 300,
  link: 300,
  code: 40, // a family code as typed
  question: 2000, // one message to the assistant
} as const;

const PERSON_FIELD_LIMITS: Record<string, keyof typeof MAX_LENGTH> = {
  firstName: "name",
  lastName: "name",
  clanName: "name",
  birthDate: "date",
  deathDate: "date",
  birthPlace: "place",
  currentPlace: "place",
  occupation: "occupation",
  notes: "story",
  whatsapp: "contact",
  instagram: "contact",
  facebook: "contact",
  tiktok: "contact",
  linkedin: "contact",
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "first name",
  lastName: "surname",
  clanName: "clan name",
  birthDate: "birth date",
  deathDate: "date of death",
  birthPlace: "birthplace",
  currentPlace: "home",
  notes: "story",
};

/** Refuse a value longer than its limit, naming the field in the message. */
export function checkLength(value: string | undefined, max: number, label: string) {
  if (value !== undefined && value.length > max) {
    throw new ConvexError(`The ${label} is too long (at most ${max} characters).`);
  }
}

/** Check every typed field of a person, including that profile links stay on their own platform. */
export function checkPersonFields(fields: Record<string, unknown>) {
  for (const [key, kind] of Object.entries(PERSON_FIELD_LIMITS)) {
    const value = fields[key];
    if (typeof value === "string") checkLength(value, MAX_LENGTH[kind], FIELD_LABELS[key] ?? key);
  }
  for (const [key, hosts] of Object.entries(PROFILE_HOSTS)) {
    const value = fields[key];
    if (typeof value === "string" && !isSafeProfileLink(value, hosts)) {
      throw new ConvexError(`Use a ${key} handle, or a link to ${hosts[0]}.`);
    }
  }
}

// ---------- Profile links ----------

/** The only sites each profile field may link to. */
export const PROFILE_HOSTS: Record<string, string[]> = {
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.com", "fb.me"],
  tiktok: ["tiktok.com"],
  linkedin: ["linkedin.com"],
};

/** A handle, or an https link to the platform itself (never a look-alike or another site). */
export function isSafeProfileLink(value: string, hosts: string[]) {
  const v = value.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) return true; // a handle, not a link
  try {
    const url = new URL(v);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && hosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

// ---------- Uploads ----------

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/avif"]);

/**
 * Accept an uploaded file only if it is a photo of a sensible size. Anything
 * else is deleted straight away, so the storage can't be used to host other
 * files.
 */
export async function requireImage(ctx: MutationCtx, storageId: Id<"_storage">) {
  const file = await ctx.db.system.get("_storage", storageId);
  if (!file) throw new ConvexError("That upload didn't arrive. Please try again.");
  const type = file.contentType?.toLowerCase() ?? "";
  if (!IMAGE_TYPES.has(type)) {
    await ctx.storage.delete(storageId);
    throw new ConvexError("Only photos can be uploaded (JPEG, PNG, WebP, GIF or HEIC).");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    await ctx.storage.delete(storageId);
    throw new ConvexError("That photo is too large. Photos can be up to 15 MB.");
  }
}

// ---------- Rate limits ----------

/**
 * Limits per signed-in account. They stop someone guessing family codes,
 * creating endless families, flooding uploads, or running up the assistant's
 * bill, while staying well above what a real family member would do.
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  joinFamilyAttempt: { kind: "token bucket", rate: 10, period: HOUR, capacity: 5 },
  startFamily: { kind: "fixed window", rate: 5, period: 24 * HOUR },
  upload: { kind: "token bucket", rate: 120, period: HOUR, capacity: 40 },
  askAssistant: { kind: "token bucket", rate: 30, period: HOUR, capacity: 10 },
  askAssistantPerMinute: { kind: "fixed window", rate: 6, period: MINUTE },
});

type LimitName = "joinFamilyAttempt" | "startFamily" | "upload" | "askAssistant" | "askAssistantPerMinute";

/** "a minute", "5 minutes", "2 hours": for telling people when to try again. */
export function waitText(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / MINUTE));
  if (minutes < 60) return minutes === 1 ? "a minute" : `${minutes} minutes`;
  const hours = Math.ceil(minutes / 60);
  return hours === 1 ? "an hour" : `${hours} hours`;
}

/** Use up one try; refuse with a friendly message once the limit is reached. */
export async function limitOrThrow(ctx: MutationCtx | ActionCtx, name: LimitName, key: string, what: string) {
  const { ok, retryAfter } = await rateLimiter.limit(ctx, name, { key });
  if (!ok) throw new ConvexError(`Too many ${what}. Please wait ${waitText(retryAfter ?? MINUTE)} and try again.`);
}
