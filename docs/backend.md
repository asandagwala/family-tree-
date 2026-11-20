# Backend reference

The backend is a [Convex](https://convex.dev) project in `convex/`. Each
top-level file is one area of the API; the website calls a function as
`api.<file>.<function>` (e.g. `api.people.createPerson`). Files in
`convex/lib/` are shared rules, not API functions.

**Conventions used below**

- **Query**: reads data; pages subscribe and update live.
- **Mutation**: changes data in one transaction (all or nothing).
- **Action**: may call outside services (Gemini); can't touch the database directly.
- **Internal**: callable only from other backend functions or the CLI
  (`npx convex run file:function`), never from the website.
- **Access**: who may call it. _Members_ means signed-in accounts that joined
  the family the data belongs to. _Visitors_ means anyone, signed in or not.
- Arguments marked `?` are optional. `sample?` chooses the sample family instead
  of the caller's own family.

## Data model (`convex/schema.ts`)

| Table             | One row per                                                                                          | Key fields                                                                                                                                                                                       | Indexes                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `families`        | family using the app                                                                                 | `name`, `code` (e.g. `RUBULUZA-7KQ4MX2P`), `clanName?` (isiduko), `clanPraise?` (izithakazelo), `whatsappGroupUrl?`                                                                              | `by_code`                                  |
| `users`           | account                                                                                              | `familyId?` (set once they join), `name?`, `email?` (from Google)                                                                                                                                |                                            |
| `people`          | person in a tree                                                                                     | names, `gender`, `birthDate?`, `deathDate?`, places, `clanName?`, `occupation?`, `notes?` (their story), contact fields, `photoId?` (portrait), `familyId?` or `sample?`                         | `by_familyId`, `by_lastName_and_firstName` |
| `parentLinks`     | parent → child link                                                                                  | `parentId`, `childId` (a child has at most two parents)                                                                                                                                          | `by_childId`, `by_parentId_and_childId`    |
| `partnerships`    | couple                                                                                               | `personA`, `personB` (stored once, lower id first)                                                                                                                                               | `by_personA_and_personB`, `by_personB`     |
| `photos`          | photo in a person's gallery                                                                          | `personId`, `storageId`, `caption?`                                                                                                                                                              | `by_personId`                              |
| `gatherings`      | album event                                                                                          | `title`, `kind` (wedding, umemulo, imbeleko, graduation, funeral, memorial, birthday, christmas, reunion, other), `date?`, `place?`, `story?`, `coverId?`, `peopleIds`, `familyId?` or `sample?` | `by_familyId`                              |
| `gatheringPhotos` | photo in a gathering                                                                                 | `gatheringId`, `storageId`, `caption?`                                                                                                                                                           | `by_gatheringId`                           |
| `settings`        | _(legacy)_ the single family's details before families existed; emptied by `migrations:intoFamilies` |                                                                                                                                                                                                  |                                            |

Dates are free text, so a bare year (`1952`) or a full date (`1952-03-14`)
both work. Photos live in Convex file storage; tables hold their storage ids.

Sign-in data (emails, password hashes, Google identities, sessions) lives in
the Convex Auth components, not in these tables.

## API by area

### `users.ts`: accounts

| Function                       | Kind              | Access      | What it does                                                                                                                                         |
| ------------------------------ | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `me()`                         | query             | anyone      | `{ signedIn: false }`, or `{ signedIn: true, member, name }`. `member` means they joined a family; `name` is a first name or email to greet them by. |
| `createUserGoogle({ method })` | internal mutation | Convex Auth | Creates the account the first time someone signs in with Google, saving their name and email.                                                        |
| `createUserEmail({ method })`  | internal mutation | Convex Auth | Creates the account when someone confirms an email sign-up.                                                                                          |
| `currentUserId()`              | internal query    | actions     | The signed-in account's id, or null.                                                                                                                 |
| `currentSpace({ sample })`     | internal query    | actions     | The space a _signed-in_ caller may use, or null. The assistant uses it.                                                                              |

### `families.ts`: families and joining

| Function                                                        | Kind     | Access    | What it does                                                                                                                                                                                                             |
| --------------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `startFamily({ familyName })`                                   | mutation | signed in | Creates a family with a new code and joins the caller to it. Max 5 per account per day.                                                                                                                                  |
| `joinFamily({ code })`                                          | mutation | signed in | Joins the family with that code (case and spaces don't matter). Returns `{ ok: true }` or `{ ok: false, error }`. A wrong code is _returned_, not thrown, so the rate limit (about 10 tries an hour) counts every guess. |
| `getSettings()`                                                 | query    | anyone    | The caller's family: `familyName`, `familyCode`, `clanName`, `clanPraise`, `whatsappGroupUrl` (all null when they have no family).                                                                                       |
| `setFamilyName({ familyName })`                                 | mutation | members   | Renames the family.                                                                                                                                                                                                      |
| `updateSettings({ clanName?, clanPraise?, whatsappGroupUrl? })` | mutation | members   | Changes only the fields passed; an empty string clears one. The group link must be a WhatsApp invite link.                                                                                                               |

### `tree.ts`: reading a tree

| Function                      | Kind           | Access                           | What it does                                                                                                                                                    |
| ----------------------------- | -------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getTree({ sample? })`        | query          | members; visitors for the sample | Everyone in the tree with a `photoUrl` for their portrait, plus all `parentLinks` and `partnerships` between them. Empty when the caller may not see that tree. |
| `treeForAssistant({ space })` | internal query | assistant                        | The tree for the assistant: people **without contact details**, relationships, photo counts, the family's clan details and the album.                           |

### `people.ts`: people and relationships

| Function                                 | Kind     | Access  | What it does                                                                                                                                            |
| ---------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createPerson({ ...person, sample? })`   | mutation | members | Adds a person to the caller's tree (or the sample). Requires a first name; trims fields and checks their lengths and profile links. Returns the new id. |
| `updatePerson({ id, ...person })`        | mutation | members | Replaces a person's details. Cleared fields are removed; the portrait is kept.                                                                          |
| `deletePerson({ id })`                   | mutation | members | Removes a person, their relationships, gallery photos and portrait, and untags them from gatherings.                                                    |
| `addParent({ childId, parentId })`       | mutation | members | Records a parent. Refuses: different trees, more than two parents, or making someone their own ancestor. Adding an existing link does nothing.          |
| `removeParent({ childId, parentId })`    | mutation | members | Removes a parent link.                                                                                                                                  |
| `addPartner({ personId, partnerId })`    | mutation | members | Records a couple (once, whichever way round). Refuses different trees or partnering with oneself.                                                       |
| `removePartner({ personId, partnerId })` | mutation | members | Removes a couple.                                                                                                                                       |

The `...person` fields are defined once in `schema.ts` as `personFields`:
`firstName`, `lastName`, `gender` (`female`, `male`, `other`, `unknown`),
`birthDate?`, `deathDate?`, `birthPlace?`, `currentPlace?`, `clanName?`,
`occupation?`, `notes?`, `whatsapp?`, `instagram?`, `facebook?`, `tiktok?`,
`linkedin?`.

### `photos.ts`: portraits and galleries

Uploading takes two steps: `generateUploadUrl()` gives a one-time URL, the
browser sends the file there and gets a storage id, then one of the functions
below saves it. Each save checks the file really is a photo (JPEG, PNG, WebP,
GIF, HEIC or AVIF, up to 15 MB) and deletes it otherwise.

| Function                                      | Kind     | Access                           | What it does                                                                                                                |
| --------------------------------------------- | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `generateUploadUrl()`                         | mutation | signed in                        | A one-time upload URL. Rate-limited per account.                                                                            |
| `setProfilePhoto({ personId, storageId })`    | mutation | members                          | Sets the portrait, or removes it with `storageId: null`. The old portrait file is deleted unless it is also in the gallery. |
| `listPhotos({ personId })`                    | query    | members; visitors for the sample | The gallery, newest first, each with a `url`.                                                                               |
| `addPhoto({ personId, storageId, caption? })` | mutation | members                          | Adds a photo to a gallery.                                                                                                  |
| `deletePhoto({ photoId })`                    | mutation | members                          | Removes a gallery photo (keeping the file if it is still the portrait).                                                     |

### `album.ts`: the family album

| Function                                                                      | Kind     | Access                           | What it does                                                                                   |
| ----------------------------------------------------------------------------- | -------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `listGatherings({ sample? })`                                                 | query    | members; visitors for the sample | All gatherings, newest first, each with `photoCount`, `coverUrl` and up to four `previewUrls`. |
| `getGathering({ id })`                                                        | query    | members; visitors for the sample | One gathering with all its photos and their URLs, or null.                                     |
| `gatheringsFor({ personId })`                                                 | query    | members; visitors for the sample | The gatherings a person was at, newest first.                                                  |
| `createGathering({ title, kind, date?, place?, story?, peopleIds, sample? })` | mutation | members                          | Adds a gathering. Everyone tagged must be in the same tree (at most 300).                      |
| `updateGathering({ id, ...same fields })`                                     | mutation | members                          | Replaces a gathering's details (the cover is kept).                                            |
| `deleteGathering({ id })`                                                     | mutation | members                          | Removes a gathering and its photos.                                                            |
| `addGatheringPhoto({ gatheringId, storageId, caption? })`                     | mutation | members                          | Adds a photo (checked like any upload).                                                        |
| `deleteGatheringPhoto({ photoId })`                                           | mutation | members                          | Removes a photo, clearing the cover if it was the cover.                                       |
| `setGatheringCover({ gatheringId, storageId })`                               | mutation | members                          | Chooses the cover; it must be one of that gathering's photos.                                  |

### `sample.ts`: the sample family

| Function             | Kind     | Access | What it does                                                                                                 |
| -------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| `loadSampleFamily()` | mutation | anyone | Creates the sample family if it doesn't exist; otherwise only repairs older copies. Safe to call repeatedly. |

The sample itself (11 people across the Rubuluza and Sondlo families, three
generations) is plain data in `convex/lib/sampleFamily.ts`.

### `assistant.ts`: the family assistant

| Function                     | Kind            | Access                                | What it does                                                                                                                                                                                                                                                                                                   |
| ---------------------------- | --------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ask({ messages, sample? })` | action          | signed in (members for a real family) | Answers the last question in `messages` (`{ role: "user" \| "assistant", content }`) from the tree's records. Returns `{ ok, text }`; `text` explains any problem (no key, rate limit, Gemini busy). Rate-limited to 6 a minute and about 30 an hour per account; questions over 2,000 characters are refused. |
| `availableModels()`          | internal action | CLI                                   | Lists the Gemini models the configured key can use: `npx convex run assistant:availableModels`.                                                                                                                                                                                                                |

Models are tried in the order of `DEFAULT_MODELS` (lite models first, since
they stay available when larger ones are busy); a busy model gets one quick
retry. Set `GEMINI_MODEL` to pin one.

### `auth.ts`: sign-in (Convex Auth)

Sets up the two sign-in methods and exports the functions the auth library
calls; the website doesn't call these by name.

- **Google**: `startSignInWithGoogle`, `completeSignInWithGoogle`.
- **Email and password**: `signUpWithEmailPassword`,
  `completeSignUpWithEmailPassword` (from the confirmation link),
  `signInWithEmailPassword`, `startPasswordRecovery`, `checkPasswordRecovery`,
  `completePasswordRecovery`, `changePassword`, `startChangeEmail`,
  `completeChangeEmail`.
- **Session**: `signOut`, `refreshSession`, `isAuthenticated`.

Emails are sent through Resend from `RESEND_FROM`; their links point at
`SITE_URL` + `/verify-email`, `/reset-password` or `/confirm-email`.
Google redirects back only to `SITE_URL` or `http://localhost:3000`.

### `migrations.ts` and `devTools.ts`: maintenance (internal)

| Function                               | What it does                                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `migrations:intoFamilies()`            | One-off: moves a pre-families deployment's single family (people, gatherings, settings, members) into a `families` row and prints its new code. |
| `migrations:moveAllToSample()`         | One-off: marks every person and gathering as sample data.                                                                                       |
| `devTools:renamePlace({ from, to })`   | Renames a place in every birthplace, home and story.                                                                                            |
| `devTools:renameSurname({ from, to })` | Renames a surname for everyone who has it.                                                                                                      |
| `devTools:clearAll()`                  | Empties every tree, album and family, with their photos. Accounts are kept. **Development only.**                                               |

These act on all families at once. Run them with `npx convex run file:function`.

## Shared rules (`convex/lib/`)

| File                 | Exports                                                                                                                                                                                          | Purpose                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `access.ts`          | `Space`, `vSpace`, `spaceArg`, `inSpace`, `spaceFields`, `canAccess`, `writableSpace`, `requireAccess`, `canAccessPerson`, `requirePersonAccess`, `canAccessGathering`, `requireGatheringAccess` | Who may read or change what. `can…` return the caller's space or null (for queries); `require…` throw a message the app can show (for mutations). Visitors may read the sample; changing anything needs an account. |
| `security.ts`        | `MAX_LENGTH`, `checkLength`, `checkPersonFields`, `PROFILE_HOSTS`, `isSafeProfileLink`, `requireImage`, `rateLimiter`, `limitOrThrow`, `waitText`                                                | Size limits on every typed field, photo-only uploads, profile links that stay on their platform, and per-account rate limits.                                                                                       |
| `tree.ts`            | `MAX_PEOPLE`, `peopleIn`, `gatheringsIn`, `loadTree`                                                                                                                                             | Reading a space's people, gatherings, and the links between people.                                                                                                                                                 |
| `people.ts`          | `cleanFields`, `requireFirstName`, `requirePerson`, `sameTree`, `orderPair`, `isAncestor`                                                                                                        | Rules for changing people and relationships.                                                                                                                                                                        |
| `familyCodes.ts`     | `normalizeCode`, `newFamilyCode`                                                                                                                                                                 | Making and matching family codes: the family name plus 8 random characters from an alphabet without look-alikes (no 0/O, 1/I/L).                                                                                    |
| `sampleFamily.ts`    | `insertSampleFamily`, `repairSampleFamily`                                                                                                                                                       | The sample family's data and how to insert it.                                                                                                                                                                      |
| `assistantPrompt.ts` | `INSTRUCTIONS`, `describeTree`                                                                                                                                                                   | What the assistant is told, and the tree written out as text.                                                                                                                                                       |

## Configuration (`convex/convex.config.ts`)

Mounts the components (Convex Auth with its Google, email and password parts;
Resend; the rate limiter) and declares the environment variables, which are
set per deployment. See [operations.md](operations.md#environment-variables).
