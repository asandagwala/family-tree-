# Imvelaphi · Family Tree

_Imvelaphi: where we come from._ A private family archive: an organic family
tree, profiles with photographs, a family album, birthdays, and an assistant
that answers questions from what the family has recorded. Many families can
use it, each with its own private tree, joined with a family code.

Live at **https://imvelaphi-family-tree.vercel.app**

Built with Next.js 16, React 19, Tailwind CSS 4, Convex, Convex Auth, Google
Gemini and Resend.

## What it does

- **Sign in** with Google, or an email address and password. Visitors can
  explore a made-up **sample family** without an account.
- **Families**: start a family tree (and get a code to share), or join one
  with a relative's code. Nobody sees a family they haven't joined.
- **Overview**: the family at a glance: generations, living and remembered,
  births by decade, coming birthdays, roots, clan names (iziduko), the
  family's izithakazelo, a featured story, and whose profiles need details.
- **Family tree**: portraits on curved branches by generation; drag, zoom,
  search, tap for a summary.
- **Profiles**: story, life details, clan name, relatives, photo gallery,
  gatherings they were at, and ways to reach them.
- **Family album**: a page per gathering (wedding, umemulo, graduation,
  funeral, reunion…) with photos, story and who was there.
- **Birthdays** and a **Stay connected** card with the family WhatsApp group.
- **Ask the family**: an assistant that answers from the tree's records and
  links everyone it mentions.

## Quick start

```bash
pnpm install
npx convex dev      # terminal 1: the backend (first run writes .env.local)
pnpm dev            # terminal 2: then open http://localhost:3000
```

Sign-in needs Google OAuth credentials on the backend, and the assistant needs
a Gemini key. Every setting is listed in
[docs/operations.md](docs/operations.md#environment-variables).

## Documentation

| Guide                                  | What's in it                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [Architecture](docs/architecture.md)   | How the pieces fit together, families and spaces, how a page loads and a change is saved                     |
| [Backend reference](docs/backend.md)   | The data model and every backend function: arguments, who may call it, what it does                          |
| [Frontend reference](docs/frontend.md) | Every route, component and helper, by feature                                                                |
| [Security](docs/security.md)           | Privacy between families, sign-in, rate limits, input checks, browser headers, and what you must do yourself |
| [Operations](docs/operations.md)       | Settings, shipping changes, everyday commands, troubleshooting                                               |

## Project layout

```
app/          pages and the sign-in route handlers
components/   screens by feature: layout, auth, home, dashboard, tree, people,
              album, birthdays, family, chat, brand, ui
lib/          hooks and helpers (family data, sample mode, dates, links, tree layout)
convex/       the backend: one file per area (families, tree, people, photos,
              album, sample, assistant, users, auth), shared rules in convex/lib/
docs/         the guides above
public/heritage/   archive photographs used in the design
```

## Shipping

Deploy the backend first (`npx convex deploy`), then push `main`; Vercel
publishes the website. Details in [docs/operations.md](docs/operations.md#shipping-a-change).

## Scripts

| Command                             | What it does                        |
| ----------------------------------- | ----------------------------------- |
| `pnpm dev`                          | Run the website locally             |
| `pnpm build`                        | Production build (also type-checks) |
| `pnpm lint`                         | ESLint                              |
| `pnpm format` / `pnpm format:check` | Prettier                            |
