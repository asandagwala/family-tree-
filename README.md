# Imvelaphi · Family Tree

*Imvelaphi: where we come from.* A family archive: an organic family tree,
rich profiles with photographs, a dashboard of the family at a glance, and an
assistant that answers questions from what the family has recorded.

Built with Next.js 16, React 19, Tailwind CSS 4, Convex, and Google Gemini.

## What's inside

- **Overview dashboard**: family name, generations, living and remembered,
  births by decade, coming birthdays, birthplaces, clan names (iziduko), a
  featured story, and whose profiles still need details.
- **Family tree**: portraits on curved branches, grouped by generation.
  Drag to pan, scroll to zoom, search to jump to someone, tap for a summary.
- **Profiles**: story, life details, clan name, parents, partners, children
  and siblings, plus a photo gallery (upload, drag and drop, set as portrait,
  lightbox).
- **Family album**: a page per gathering (wedding, umemulo, graduation,
  funeral, reunion...) with its photos, its story and who was there. People's
  profiles list the gatherings they were at.
- **Ask the family**: a chat drawer, open from anywhere, that answers from the
  tree's records and links each person it mentions to their profile.

## Running locally

```bash
pnpm install
npx convex dev      # keeps the backend running; first run sets up .env.local
pnpm dev            # in a second terminal, then open http://localhost:3000
```

### Switching on the assistant

The assistant uses Google Gemini. Give the Convex backend your Google AI
Studio key (it prompts for the value, so it stays out of your shell history):

```bash
npx convex env set GEMINI_API_KEY
```

Without a key the chat still opens and explains how to switch it on. To pin a
specific model, also set `GEMINI_MODEL` (e.g. `gemini-flash-latest`).

### Sample data

An empty tree offers a sample three-generation family. To wipe the tree
during development: `npx convex run family:clearAll` (internal; the app can't
call it).

## Sign-in and the family code

Everyone signs in with a username and a **passkey** (fingerprint, face or PIN
on their own device). New accounts then enter the **family code** once to see
the real archive; anyone signed in can explore the sample family.

Set the family code on each Convex deployment (it prompts for the value):

```bash
npx convex env set FAMILY_CODE            # development
npx convex env set FAMILY_CODE --prod     # live site
```

Passkeys are tied to the site's domain. Local development needs nothing extra.
For the live site, set once on production:

```bash
npx convex env set PASSKEY_RP_ID imvelaphi-family-tree.vercel.app --prod
npx convex env set PASSKEY_ORIGIN https://imvelaphi-family-tree.vercel.app --prod
```

## Deploying

Live at https://imvelaphi-family-tree.vercel.app (Vercel project
`imvelaphi-family-tree`, backed by the Convex **production** deployment).

```bash
npx convex deploy                 # push backend changes to production
npx vercel deploy --prod          # build and publish the website
```

The production backend needs its own Gemini key, once:
`npx convex env set GEMINI_API_KEY --prod`.

## Project layout

| Path | What it holds |
| --- | --- |
| `convex/schema.ts` | `people`, `parentLinks`, `partnerships`, `photos` |
| `convex/family.ts` | Tree queries, relationship rules, photo storage |
| `convex/assistant.ts` | The assistant: tree → prompt → Gemini |
| `lib/tree-layout.ts` | Generation layout and branch geometry |
| `components/dashboard.tsx` | Overview page |
| `components/tree-view.tsx` | Interactive tree |
| `components/person-profile.tsx` | Profile, relatives, gallery |
| `convex/album.ts` | Gatherings and their photos |
| `components/album-view.tsx`, `gathering-view.tsx` | Album and gathering pages |
| `components/chat/` | Assistant drawer and conversation state |
| `public/heritage/` | Archive photographs used in the design |
