# Imvelaphi · Family Tree

*Imvelaphi: where we come from.* A family archive: an organic family tree,
rich profiles with photographs, a dashboard of the family at a glance, and an
assistant that answers questions from what the family has recorded.

Built with Next.js 16, React 19, Tailwind CSS 4, Convex, and Claude.

## What's inside

- **Overview dashboard**: family name, generations, living and remembered,
  births by decade, coming birthdays, birthplaces, clan names (iziduko), a
  featured story, and whose profiles still need details.
- **Family tree**: portraits on curved branches, grouped by generation.
  Drag to pan, scroll to zoom, search to jump to someone, tap for a summary.
- **Profiles**: story, life details, clan name, parents, partners, children
  and siblings, plus a photo gallery (upload, drag and drop, set as portrait,
  lightbox).
- **Ask the family**: a chat drawer, open from anywhere, that answers from the
  tree's records and links each person it mentions to their profile.

## Running locally

```bash
pnpm install
npx convex dev      # keeps the backend running; first run sets up .env.local
pnpm dev            # in a second terminal, then open http://localhost:3000
```

### Switching on the assistant

The assistant uses Claude (`claude-opus-5-5`). Give the Convex backend an
Anthropic API key:

```bash
npx convex env set ANTHROPIC_API_KEY <your key>
```

Without a key the chat still opens and explains how to switch it on.

### Sample data

An empty tree offers a sample three-generation family. To wipe the tree
during development: `npx convex run family:clearAll` (internal; the app can't
call it).

## Project layout

| Path | What it holds |
| --- | --- |
| `convex/schema.ts` | `people`, `parentLinks`, `partnerships`, `photos` |
| `convex/family.ts` | Tree queries, relationship rules, photo storage |
| `convex/assistant.ts` | The assistant: tree → prompt → Claude |
| `lib/tree-layout.ts` | Generation layout and branch geometry |
| `components/dashboard.tsx` | Overview page |
| `components/tree-view.tsx` | Interactive tree |
| `components/person-profile.tsx` | Profile, relatives, gallery |
| `components/chat/` | Assistant drawer and conversation state |
| `public/heritage/` | Archive photographs used in the design |
