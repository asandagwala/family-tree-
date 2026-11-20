# Operations

Running the app on your computer, configuring it, shipping changes, and
looking after the live site.

## Deployments

|                 | Website                                                                           | Backend                                                                  |
| --------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Development** | `http://localhost:3000` (`pnpm dev`)                                              | Convex dev deployment (`elegant-pheasant-297`), used by `npx convex dev` |
| **Live**        | https://imvelaphi-family-tree.vercel.app (Vercel project `imvelaphi-family-tree`) | Convex production deployment (`secret-parakeet-330`)                     |

The two backends have separate data and separate settings.

## Running locally

```bash
pnpm install
npx convex dev      # terminal 1: keeps the dev backend in sync; first run writes .env.local
pnpm dev            # terminal 2: then open http://localhost:3000
```

After changing colours in `app/globals.css`, if the page looks stale, stop
`pnpm dev`, delete `.next`, and start it again.

## Environment variables

Set on each Convex deployment. `npx convex env set NAME "value"` sets one;
add `--prod` for the live site. Write the value in the command itself: if you
leave it out, some terminals paste the command into the value instead.

| Name                                                 | Needed for                              | Where it comes from                                                                                                                            |
| ---------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_GOOGLE_CLIENT_ID`, `AUTH_GOOGLE_CLIENT_SECRET` | Google sign-in (required)               | Google Cloud Console → Credentials → OAuth client (Web application). Google shows a secret only once, when it's created.                       |
| `SITE_URL`                                           | Email links and Google's return address | The website's address, e.g. `https://imvelaphi-family-tree.vercel.app` (defaults to `http://localhost:3000`)                                   |
| `RESEND_API_KEY`                                     | Sign-up and reset emails                | resend.com → API keys                                                                                                                          |
| `RESEND_FROM`                                        | Sending to anyone                       | An address on a domain verified in Resend, e.g. `Imvelaphi <hello@mail.imvelaphi.site>`. Without it, Resend only delivers to your own address. |
| `GEMINI_API_KEY`                                     | The assistant                           | Google AI Studio                                                                                                                               |
| `GEMINI_MODEL`                                       | Optional: pin one Gemini model          | See `npx convex run assistant:availableModels`                                                                                                 |

The website itself needs only `NEXT_PUBLIC_CONVEX_URL` (set in Vercel to the
production backend's `.convex.cloud` address; `npx convex dev` writes the dev
one into `.env.local`).

**Google OAuth client.** Add each backend's callback as an _Authorised
redirect URI_: `https://<deployment>.convex.site/oauth/google/callback`, for
both `elegant-pheasant-297.eu-west-1` (dev) and `secret-parakeet-330` (live).

## Shipping a change

The website deploys automatically when `main` is pushed to GitHub. The
backend does **not**: deploy it yourself.

1. Run the checks: `pnpm lint`, `npx tsc --noEmit -p .`, `pnpm build`.
2. If anything in `convex/` changed, deploy the backend **first**:
   ```bash
   npx convex deploy
   ```
   Answer _yes_; it has worked when the last lines show no red ✖.
3. Push `main`; Vercel publishes the site within a minute or two.

Backend first, because new website code may call functions the old backend
doesn't have. If a deploy stops with "environment variables … were not set",
set them with `--prod` and deploy again.

## Everyday tasks

| Task                                         | Command                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| See live errors and logs                     | `npx convex logs --prod`                                                           |
| List live settings (names only)              | `npx convex env list --prod`                                                       |
| Which Gemini models the key can use          | `npx convex run assistant:availableModels`                                         |
| Format the code                              | `pnpm format`                                                                      |
| Check libraries for vulnerabilities          | `pnpm audit --prod`                                                                |
| Empty every tree (**development only**)      | `npx convex run devTools:clearAll`                                                 |
| Rename a place or surname everywhere         | `npx convex run devTools:renamePlace '{"from":"A","to":"B"}'` (or `renameSurname`) |
| Move a pre-families deployment into a family | `npx convex run migrations:intoFamilies` (add `--prod` for live)                   |

## Troubleshooting

| Symptom                                                      | Likely cause                                                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Live site stuck on the tree logo                             | The live backend is older than the website: run `npx convex deploy`.                                        |
| "Could not find public function …" in the logs               | Same: deploy the backend.                                                                                   |
| Google says "The OAuth client was not found"                 | `AUTH_GOOGLE_CLIENT_ID` is wrong on that backend (check for pasted command text).                           |
| Google shows `….convex.site` instead of "Imvelaphi"          | Google shows the app name only once the brand is verified in Google Cloud.                                  |
| Sign-up says "We sent you a link" but nothing arrives        | `RESEND_FROM` isn't set on a verified domain, or check spam. `npx convex logs --prod` shows Resend's error. |
| Email sign-in says there is no account                       | The address signed up with Google, or never confirmed its link.                                             |
| The assistant says it isn't switched on                      | `GEMINI_API_KEY` isn't set on that backend.                                                                 |
| A loading logo that never finishes, only in a background tab | Browsers pause background tabs; it's fine in a visible tab.                                                 |

## Backups

Convex keeps the data, but take your own copy before big changes: Convex
dashboard → the production deployment → Settings → Backups.
