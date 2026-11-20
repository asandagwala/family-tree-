import type { Person } from "./people";

export type ContactLink = { key: string; label: string; detail: string; href: string };

const strip = (s: string) => s.trim().replace(/^@/, "");
const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

/** An https link on the platform itself; anything else (another site, a look-alike) is not used as a link. */
function onPlatform(s: string, hosts: string[]) {
  try {
    const url = new URL(s.trim());
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && hosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** WhatsApp link from a phone number; a local SA number (0821234567) becomes +27. */
export function whatsappHref(number: string) {
  let digits = number.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 10) digits = `27${digits.slice(1)}`;
  return digits ? `https://wa.me/${digits}` : null;
}

/** The ways to reach someone, as links, in a fixed order. */
export function contactLinks(p: Pick<Person, "whatsapp" | "instagram" | "facebook" | "tiktok" | "linkedin">): ContactLink[] {
  const out: ContactLink[] = [];
  if (p.whatsapp) {
    const href = whatsappHref(p.whatsapp);
    if (href) out.push({ key: "whatsapp", label: "WhatsApp", detail: p.whatsapp, href });
  }
  if (p.instagram) {
    const h = strip(p.instagram);
    if (!isUrl(h) || onPlatform(h, ["instagram.com"]))
      out.push({ key: "instagram", label: "Instagram", detail: isUrl(h) ? "Profile" : `@${h}`, href: isUrl(h) ? h : `https://instagram.com/${encodeURIComponent(h)}` });
  }
  if (p.facebook) {
    const h = p.facebook.trim();
    if (!isUrl(h) || onPlatform(h, ["facebook.com", "fb.com", "fb.me"]))
      out.push({ key: "facebook", label: "Facebook", detail: isUrl(h) ? "Profile" : h, href: isUrl(h) ? h : `https://facebook.com/${encodeURIComponent(h)}` });
  }
  if (p.tiktok) {
    const h = strip(p.tiktok);
    if (!isUrl(h) || onPlatform(h, ["tiktok.com"]))
      out.push({ key: "tiktok", label: "TikTok", detail: isUrl(h) ? "Profile" : `@${h}`, href: isUrl(h) ? h : `https://www.tiktok.com/@${encodeURIComponent(h)}` });
  }
  if (p.linkedin) {
    const h = p.linkedin.trim();
    if (!isUrl(h) || onPlatform(h, ["linkedin.com"]))
      out.push({ key: "linkedin", label: "LinkedIn", detail: isUrl(h) ? "Profile" : h, href: isUrl(h) ? h : `https://www.linkedin.com/in/${encodeURIComponent(strip(h))}` });
  }
  return out;
}
