# Frontend reference

The website is a Next.js 16 App Router project. Pages in `app/` are thin: each
renders one screen from `components/`. Screens get their data from Convex
through hooks, so they update live when anyone changes the family.

## Routes (`app/`)

| Route                                            | Screen                                    | Notes                                                                                                                                           |
| ------------------------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                              | `Welcome` (`components/home/welcome.tsx`) | The front door. Visitors see the sign-in screen instead (the gate decides). A new family sees "Begin the … family's story" and its family code. |
| `/overview`                                      | `Dashboard`                               | The family at a glance.                                                                                                                         |
| `/tree`                                          | `TreeView`                                | The interactive tree.                                                                                                                           |
| `/people`                                        | `PeopleDirectory`                         | Everyone, searchable.                                                                                                                           |
| `/people/[id]`                                   | `PersonProfile`                           | One person: story, details, relatives, photos, gatherings, ways to reach them.                                                                  |
| `/album`                                         | `AlbumView`                               | All gatherings.                                                                                                                                 |
| `/album/[id]`                                    | `GatheringView`                           | One gathering: photos, story, who was there.                                                                                                    |
| `/birthdays`                                     | `BirthdaysView`                           | Coming birthdays.                                                                                                                               |
| `/verify-email`, `/reset-password`               | (empty pages)                             | The gate shows the matching email-link screen, using the `code` in the address.                                                                 |
| `/auth/signin`, `/auth/refresh`, `/auth/signout` | route handlers                            | Convex Auth's server side: they move the session into an httpOnly cookie. Configured in `lib/auth/serverAuth.ts`.                               |

`app/layout.tsx` wraps every page in `ConvexAuthNextjsServerProvider` (the
session), `ChatProvider` (the assistant's conversation) and `AppShell` (the
gate and the frame). Every page sets `export const instant = false`: it waits
for the sign-in check, so there is no instant shell for Next.js to validate.

`proxy.ts` refreshes the session before each page; it never redirects.

## Components by feature (`components/`)

### `layout/`: the frame

| File                | Exports                                       | Role                                                                                                                |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `app-shell.tsx`     | `AppShell`                                    | The gate, then the sidebar, main area, mobile bottom bar and chat drawer. Also the "Signed in as … · Sign out" row. |
| `nav.tsx`           | `SidebarNav`, `MobileNavLinks`, `ActiveAware` | The page links, highlighting the current page. `ActiveAware` reads the URL inside Suspense.                         |
| `sample-banner.tsx` | `SampleBanner`                                | The bar shown while exploring the sample family, with "Back to my family" (members) or "Sign in" (visitors).        |

### `auth/`: getting in

| File                     | Exports                                        | Role                                                                                                                                                        |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth-gate.tsx`          | `AuthGate`                                     | Decides what to show: email-link screens, the sign-in screen, the family-code screen, or the app (see [architecture.md](architecture.md#how-a-page-loads)). |
| `sign-in-screen.tsx`     | `SignInScreen`                                 | Continue with Google; email sign-in, account creation and password reset; "Explore a sample family" for visitors.                                           |
| `password-input.tsx`     | `PasswordInput`                                | A password field with a show/hide eye.                                                                                                                      |
| `email-link-screens.tsx` | `VerifyEmailScreen`, `ResetPasswordScreen`     | Where the confirmation and reset emails' links land. Links must be opened in the browser that asked for them.                                               |
| `family-code-screen.tsx` | `FamilyCodeScreen`                             | After first sign-in: join with a family code, or start a new family tree.                                                                                   |
| `auth-layout.tsx`        | `AuthLayout`, `Heading`, `ErrorNote`, `Splash` | The shared frame (words left, photograph right, beadwork hem) that fits one screen at any size.                                                             |
| `auth-errors.ts`         | `authMessage`                                  | A plain-language message for every sign-in error code (an exhaustive switch).                                                                               |

### `home/`, `dashboard/`, `tree/`

| File                               | Exports                            | Role                                                                                                                                  |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `home/welcome.tsx`                 | `Welcome`                          | The front door for a family: start the tree, explore the sample, share the code.                                                      |
| `dashboard/dashboard.tsx`          | `Dashboard`                        | Lays out the cards below; shows `Welcome` when the tree is empty.                                                                     |
| `dashboard/hero.tsx`               | `Hero`                             | Family name (editable), an "Ask anything about the family" box and quick questions that open the assistant, the photograph and stats. |
| `dashboard/stats-row.tsx`          | `StatsRow`                         | Members, generations, living, places.                                                                                                 |
| `dashboard/births-by-decade.tsx`   | `BirthsByDecade`                   | A small bar chart.                                                                                                                    |
| `dashboard/upcoming-birthdays.tsx` | `UpcomingBirthdays`                | The next few birthdays.                                                                                                               |
| `dashboard/featured-story.tsx`     | `FeaturedStory`                    | One person's story from the archive.                                                                                                  |
| `dashboard/roots-and-clans.tsx`    | `Roots`, `ClanNames`, `FamilyClan` | Birthplaces, everyone's clan names, the family's isiduko and izithakazelo.                                                            |
| `dashboard/stay-connected.tsx`     | `StayConnected`                    | WhatsApp group, the family code, and who can be reached where.                                                                        |
| `dashboard/missing-details.tsx`    | `MissingDetails`                   | Whose profiles still need a portrait, dates, places or a story.                                                                       |
| `dashboard/card.tsx`               | `Card`                             | The panel every card sits in.                                                                                                         |
| `tree/tree-view.tsx`               | `TreeView`                         | Pan, zoom, search and tap-for-summary over the layout from `lib/tree-layout.ts`.                                                      |

### `people/`

| File                    | Exports                         | Role                                                                                              |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `people-directory.tsx`  | `PeopleDirectory`               | Everyone in black-and-white portraits, with a search box and an all / living / remembered filter. |
| `person-profile.tsx`    | `PersonProfile`                 | A person's page, built from the parts below.                                                      |
| `relatives.tsx`         | `RelativeGroup`, `LinkExisting` | Parents, partners, children and siblings, with "add new" or "link someone already in the tree".   |
| `gallery.tsx`           | `Gallery`                       | Photos: upload (or drag and drop), set as portrait, delete, view in the lightbox.                 |
| `person-gatherings.tsx` | `PersonGatherings`              | Gatherings they were at.                                                                          |
| `connect.tsx`           | `Connect`                       | WhatsApp and social links.                                                                        |
| `person-editor.tsx`     | `PersonEditor`                  | The add/edit form, optionally linking the new person as a parent, partner or child.               |
| `portrait.tsx`          | `Portrait`                      | A round portrait, or initials on a soft tone.                                                     |

### `album/`, `birthdays/`, `family/`, `chat/`

| File                               | Exports                     | Role                                                                                                                          |
| ---------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `album/album-view.tsx`             | `AlbumView`                 | The album grid.                                                                                                               |
| `album/gathering-view.tsx`         | `GatheringView`             | One gathering's photos, story and people.                                                                                     |
| `album/gathering-editor.tsx`       | `GatheringEditor`           | Add or edit a gathering.                                                                                                      |
| `album/lightbox.tsx`               | `Lightbox`                  | Full-screen photo viewer with keyboard navigation.                                                                            |
| `birthdays/birthdays-view.tsx`     | `BirthdaysView`             | Every coming birthday, with WhatsApp wishes links.                                                                            |
| `family/family-details-editor.tsx` | `FamilyDetailsEditor`       | Edit the family's isiduko, izithakazelo and WhatsApp group.                                                                   |
| `family/family-code.tsx`           | `FamilyCode`                | Shows the family code with a copy button.                                                                                     |
| `chat/chat-context.tsx`            | `ChatProvider`, `useChat`   | The conversation, kept while moving between pages. `useChat()` gives `open`, `close`, `send`, `reset`, `messages`, `pending`. |
| `chat/chat-drawer.tsx`             | `ChatDrawer`, `SUGGESTIONS` | The assistant's drawer.                                                                                                       |
| `chat/rich-text.tsx`               | `RichText`                  | Renders the assistant's answers; `person:ID` links become profile links.                                                      |

### `brand/` and `ui/`

| File                 | Exports                                                                                               | Role                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `brand/logo.tsx`     | `LogoMark`                                                                                            | The umbrella-tree logo.                                 |
| `brand/beadwork.tsx` | `UmbhacoBand`, `UmbhacoTrim`, `BeadworkBand`, `MonoBeadTrim`, `DiamondRule`, `DiamondBand`, `BeadNet` | Patterns drawn from umbhaco and Xhosa beadwork, as SVG. |
| `brand/ask-icon.tsx` | `AskIcon`                                                                                             | The assistant's icon.                                   |
| `ui/modal.tsx`       | `Modal`, `inputCls`, `btnPrimary`, `btnSecondary`, `btnGhost`                                         | The dialog and the shared input and button styles.      |

## Helpers (`lib/`)

| File                  | Exports                                                                                                                                      | Role                                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `use-family.ts`       | `useFamily`, `siblingsOf`, `Family`                                                                                                          | The whole tree with lookup maps (`people`, `parentsOf`, `childrenOf`, `partnersOf`, sorted by birth). Follows sample mode unless told which space. `undefined` while loading. |
| `sample-mode.ts`      | `useSampleMode`                                                                                                                              | `{ sample, enterSample, exitSample }`, kept in `sessionStorage`.                                                                                                              |
| `people.ts`           | `Person`, `fullName`, `initials`, `year`, `lifespan`, `formatDate`, `age`, `genderLabel`, `errorMessage`, `initialsTone`, `initialsMonoTone` | Formatting people and showing backend errors (`errorMessage` shows a `ConvexError`'s message, or a generic one).                                                              |
| `birthdays.ts`        | `upcomingBirthdays`, `unknownBirthdays`, `whenLabel`                                                                                         | Who has a birthday soon, and "in 3 days" labels.                                                                                                                              |
| `contact.ts`          | `contactLinks`, `whatsappHref`                                                                                                               | Turns a person's contact fields into safe links (profile links only to their own platform; local SA numbers become `+27`).                                                    |
| `gatherings.ts`       | `GATHERING_KINDS`, `gatheringKindLabel`                                                                                                      | Gathering kinds and their labels.                                                                                                                                             |
| `tree-layout.ts`      | `layoutTree`, `CARD_W`, `CARD_H`, `PORTRAIT`                                                                                                 | Pure layout: generations top to bottom, partners side by side, children under their parents, and the branch shapes between them.                                              |
| `upload.ts`           | `uploadImage`, `MAX_PHOTO_BYTES`                                                                                                             | Upload a photo (checked for type and 15 MB) and get its storage id.                                                                                                           |
| `auth/convexAuth.tsx` | `ConvexAuthNextjsServerProvider`, `convexAuthNextjsProxy`, …                                                                                 | Convex Auth's Next.js set-up.                                                                                                                                                 |
| `auth/serverAuth.ts`  | `auth`                                                                                                                                       | The sign-in route handlers and the list of functions allowed to create a session.                                                                                             |

## Styling

Tailwind CSS 4 with design tokens in `app/globals.css` (cream, ink, forest,
ochre, bead blue and friends, plus `duotone` for archive photographs).
Container queries (`@container`, `@3xl:`) let screens adapt to their space.
Fonts are Cormorant Garamond (headings) and Geist (text), loaded by
`next/font`, so no request leaves the site for them.

## Accessibility

- Every page has a title, landmarks (`main`, `nav`) and headings in order; the
  page language is set.
- Images have descriptions; icon buttons have names; the closed chat drawer
  is `inert`, so keyboard users don't tab into it.
- Form fields use `LabeledInput` (`components/ui/labeled-input.tsx`): the
  label stays visible inside the box instead of a placeholder that disappears.
- The family tree works by keyboard: Tab moves through people generation by
  generation (with a ring and the view following), Enter opens their summary
  and moves focus into it, Escape closes it.
- Each couple's lines in the tree have their own colour (`coupleColours` in
  `lib/tree-layout.ts`); one person's relationships never share a colour.
- Text colours meet WCAG AA contrast (4.5:1 for small text).
- `prefers-reduced-motion` turns animations and transitions off.

## Code style

- `pnpm lint` (ESLint) and `pnpm format` (Prettier, 120 columns) keep the code tidy.
- One screen or section per file; folders by feature.
- Comments explain _why_, not what.
