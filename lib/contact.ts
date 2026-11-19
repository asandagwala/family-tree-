import type { Person } from "./people";

export type ContactLink = { key: string; label: string; detail: string; href: string };

const strip = (s: string) => s.trim().replace(/^@/, "");
const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

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
    out.push({ key: "instagram", label: "Instagram", detail: `@${h}`, href: isUrl(h) ? h : `https://instagram.com/${h}` });
  }
  if (p.facebook) {
    const h = p.facebook.trim();
    out.push({ key: "facebook", label: "Facebook", detail: isUrl(h) ? "Profile" : h, href: isUrl(h) ? h : `https://facebook.com/${encodeURIComponent(h)}` });
  }
  if (p.tiktok) {
    const h = strip(p.tiktok);
    out.push({ key: "tiktok", label: "TikTok", detail: `@${h}`, href: isUrl(h) ? h : `https://www.tiktok.com/@${h}` });
  }
  if (p.linkedin) {
    const h = p.linkedin.trim();
    out.push({ key: "linkedin", label: "LinkedIn", detail: isUrl(h) ? "Profile" : h, href: isUrl(h) ? h : `https://www.linkedin.com/in/${encodeURIComponent(strip(h))}` });
  }
  return out;
}
