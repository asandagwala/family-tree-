# Architecture

How Imvelaphi fits together: the pieces, how a request flows through them, and
the few ideas everything else builds on.

## The pieces

```
 Browser (Next.js + React)                     Convex (backend)                     Outside services
 ─────────────────────────                     ────────────────                     ────────────────
 app/          pages and routes      ──────▶   queries / mutations / actions  ──▶  Google Gemini (assistant)
 components/   screens, by feature    live     convex/lib/ shared rules        ──▶  Resend (sign-up & reset emails)
 lib/          helpers and hooks      sync     database + file storage         ◀──  Google OAuth (sign-in)
 proxy.ts      session refresh                 Convex Auth components
```

| Layer                           | Technology                                                   | Where                                      |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| Website                         | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4 | `app/`, `components/`, `lib/`              |
| Backend, database, file storage | Convex                                                       | `convex/`                                  |
| Sign-in                         | Convex Auth: Google, and email + password                    | `convex/auth.ts`, `lib/auth/`, `app/auth/` |
| Family assistant                | Google Gemini via `@google/genai`                            | `convex/assistant.ts`                      |
| Email                           | Resend (through the `@convex-dev/resend` component)          | configured in `convex/auth.ts`             |
| Abuse limits                    | `@convex-dev/rate-limiter`                                   | `convex/lib/security.ts`                   |
| Hosting                         | Vercel (website), Convex (backend)                           |                                            |

Convex is reactive: the website subscribes to queries over a WebSocket, and
when data changes every open page updates by itself. There is no REST API and
no state to keep in sync by hand.

## Core ideas

### Families and spaces

Many families share one site, each with a private tree. Every person and every
gathering belongs to exactly one **space**:

- a **family** (`familyId` is set), seen only by accounts that joined that family, or
- the **sample family** (`sample: true`), a made-up family anyone may look at.

Every backend function starts by working out the caller's space with the
helpers in `convex/lib/access.ts` (`canAccess` for reading, `requireAccess` and
friends for changing). No function reads or writes a row without that check,
so one family can never see another's data. See [security.md](security.md).

### Joining a family

An account starts outside any family. After signing in, a person either
**starts a family tree** (they become its first member and get its code) or
**joins** one by typing the family code a relative shared, e.g.
`RUBULUZA-7KQ4MX2P`. The code is the only key to a family, so it is long and
random, and wrong guesses are rate-limited.

### Sample mode

Visitors, and members who want to look around, can explore the sample family.
Whether a page shows the sample or the real family is a browser-side switch
(`lib/sample-mode.ts`, kept in `sessionStorage`); every query takes a
`sample` flag, and the server decides whether that space may be read.
Visitors may only _look_: changing the sample, uploading and the assistant
need an account.

## How a page loads

1. **`proxy.ts`** runs before each page: Convex Auth refreshes the session
   cookie if needed. It never redirects; pages decide what visitors see.
2. **`app/layout.tsx`** wraps every page in the auth provider, the chat
   provider and `AppShell`.
3. **`AuthGate`** (`components/auth/auth-gate.tsx`) chooses what to show:
   - the email-link pages (`/verify-email`, `/reset-password`), whoever is signed in;
   - the sign-in screen for visitors, unless they are exploring the sample;
   - the family-code screen for accounts that haven't joined a family;
   - otherwise the page itself, inside the sidebar layout.
4. The page's components subscribe to Convex queries through hooks such as
   `useFamily()` and render as the data arrives.

## How a change is saved

A component calls a mutation, e.g. `useMutation(api.people.createPerson)`.
The mutation checks access, validates the input (lengths, image type,
relationship rules), writes to the database in one transaction, and every
page subscribed to affected data updates automatically.

## How the assistant answers

1. The chat drawer sends the conversation to the `assistant.ask` action.
2. The action checks the caller may use the assistant (signed in, rate limits).
3. It loads the tree with `tree.treeForAssistant`, which leaves out contact
   details, and turns it into text (`convex/lib/assistantPrompt.ts`).
4. It asks Gemini, trying a list of models in order, and returns the answer,
   whose person links (`person:ID`) the drawer turns into profile links.

## Folder map

```
app/                    routes: one folder per page, plus /auth route handlers
components/
  layout/               the frame: sidebar, mobile nav, sample banner
  auth/                 sign-in, email links, family code, the gate
  home/                 the front door for a new family
  dashboard/            the overview page, one file per card
  tree/                 the interactive family tree
  people/               directory, profile (and its parts), editor, portrait
  album/                gatherings, their photos, the lightbox
  birthdays/            the birthdays page
  family/               family details and family code
  chat/                 the assistant drawer and its state
  brand/                logo and beadwork patterns
  ui/                   modal and shared button / input styles
lib/                    hooks and helpers with no layout (dates, contacts, tree layout…)
  auth/                 Convex Auth set-up for Next.js
convex/                 the backend API, one file per area
  lib/                  rules shared by the API (access, security, tree loading…)
docs/                   this documentation
public/heritage/        archive photographs used in the design
```

More detail: [backend.md](backend.md) · [frontend.md](frontend.md) ·
[security.md](security.md) · [operations.md](operations.md)
