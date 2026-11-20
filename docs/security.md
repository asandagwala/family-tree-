# Security

What protects the app, where each protection lives, and what you must do
yourself.

## Privacy between families

- Every family's people, photos, album and settings are tagged with its
  `familyId`; the sample family is tagged `sample: true`.
- Every backend function checks the caller's space first, with the helpers in
  `convex/lib/access.ts`. Reads return nothing, and changes are refused, for
  data outside the caller's family.
- Relationships and album tags can't cross families: linking two people or
  tagging someone checks they are in the same tree.
- Visitors may _look at_ the sample family only. Changing it, uploading and
  the assistant need an account.
- The family code is the only way into a family: the family name plus 8
  random characters (about 850 billion possibilities).

## Sign-in

- Convex Auth handles sign-in. Passwords are stored hashed, the session's
  refresh token lives in an httpOnly cookie, and sign-in requests go through
  the site's own `/auth/signin` route, which only accepts the functions listed
  in `lib/auth/serverAuth.ts`.
- Email accounts must confirm their address by a link before their first
  sign-in. Links expire and work only in the browser that asked for them.
- Google sign-in returns only to `SITE_URL` (or localhost in development).
- The auth library rate-limits sign-in and password-reset attempts.

## Abuse limits (`convex/lib/security.ts`)

Per account:

| What                | Limit                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Family code guesses | about 10 an hour (bursts of 5). Wrong codes are returned rather than thrown, so every guess is counted. |
| New family trees    | 5 a day                                                                                                 |
| Photo uploads       | about 120 an hour (bursts of 40)                                                                        |
| Assistant questions | 6 a minute, about 30 an hour; at most 2,000 characters each                                             |

## Input checks

- **Lengths**: every typed field has a maximum (names 60 characters, places
  100, stories 5,000, captions 300, and so on), so the database and the
  assistant's prompt can't be flooded.
- **Uploads**: only photos (JPEG, PNG, WebP, GIF, HEIC, AVIF) up to 15 MB are
  kept. Anything else is deleted the moment it is saved. A gathering's cover
  must be one of its own photos.
- **Links**: Instagram, Facebook, TikTok and LinkedIn fields accept a handle or
  an `https` link to that platform only, so a profile can't link to a phishing
  site. The WhatsApp group must be a WhatsApp invite link. The website applies
  the same rule when showing links, so links saved before the rule was added
  are not clickable.
- The website never inserts raw HTML; React escapes everything.

## In the browser (`next.config.ts`)

Every response carries:

| Header                                             | Effect                                                                                                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`                          | Scripts, styles, fonts and images come only from the site (images and data also from `*.convex.cloud`); no plugins; the site can't be framed; forms post only to the site. |
| `X-Frame-Options: DENY`                            | No clickjacking through hidden frames (older browsers).                                                                                                                    |
| `X-Content-Type-Options: nosniff`                  | Browsers don't guess file types.                                                                                                                                           |
| `Strict-Transport-Security`                        | Always HTTPS (live site only).                                                                                                                                             |
| `Referrer-Policy: strict-origin-when-cross-origin` | Other sites never see which page a visitor came from.                                                                                                                      |
| `Permissions-Policy`                               | No camera, microphone, location, payment or USB.                                                                                                                           |
| `Cross-Origin-Opener-Policy: same-origin`          | Other windows can't reach into the site.                                                                                                                                   |

The `X-Powered-By` header is turned off. The CSP allows inline scripts,
because Next.js uses them to start the page.

## The assistant

- It sees names, dates, places, clan names, stories and the album, but never
  phone numbers or social handles (`tree.treeForAssistant` strips them).
- That data is sent to Google's Gemini API to answer questions. Mention this
  if someone asks where their data goes.

## Secrets

- No keys are in the code or its git history; `.env*` files are git-ignored.
- Secrets live as Convex environment variables (`npx convex env set NAME`),
  set separately for development and production. See [operations.md](operations.md).

## Your part

1. **Turn on two-factor sign-in** for the accounts that control the app:
   Google, GitHub, Vercel, Convex, Resend and Cloudflare. Anyone in one of those
   can bypass everything above.
2. **Keep the Convex dashboard to yourself.** It can see every family's data.
3. If a family code leaks, there is no "new code" button yet; it can be changed
   in the Convex dashboard's data view (the `families` table).
4. Run `pnpm audit --prod` now and then to catch vulnerable libraries.
