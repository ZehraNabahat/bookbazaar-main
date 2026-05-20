# Netlify demo in ~15 minutes

You need **two hosts**: Netlify (website) + API (Render or existing Railway URL).

## Part A — Backend API (Render, ~5 min)

1. Go to [render.com](https://render.com) → sign up with **email** (or GitHub).
2. **New** → **Web Service** → connect repo `ZehraNabahat/bookbazaar-main`.
3. **Root Directory:** `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. **Environment** (copy from your local `backend/.env`):

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | any long random string |
   | `FRONTEND_URL` | your Netlify URL (set after Part B, then redeploy) |
   | `STRIPE_SECRET_KEY` | your Stripe secret |
   | `STRIPE_CURRENCY` | `pkr` |
   | Cloudinary / Gemini | as in `.env` |

7. **Create Web Service** → copy the URL, e.g. `https://bookbazaar-api.onrender.com`
8. Open that URL in the browser — you must see: `E-Commerce API is running`

## Part B — Frontend (Netlify, ~10 min)

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → **GitHub** → `bookbazaar-main`.
2. **Site configuration** (critical):

   | Setting | Value |
   |---------|--------|
   | **Branch** | `main` |
   | **Base directory** | leave **empty** (repo root `netlify.toml` sets `base = "frontend"`) |
   | **Build command** | leave empty (uses `netlify.toml`) |
   | **Publish directory** | leave **empty** — delete `.next` if it is set |

3. **Environment variables** → **Add**:

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `NEXT_PUBLIC_API_URL` | Render API URL from Part A (no trailing `/`) |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | your `pk_test_...` |
   | `SITE_URL` | your Netlify site URL (e.g. `https://yoursite.netlify.app`) |

4. **Deploy site** and wait until **Published**.
5. Open the Netlify **site URL** (not the deploy log URL).

## Part C — Link them

1. Netlify → **Site configuration** → **Domain management** → copy your live URL.
2. Render → backend service → **Environment** → set `FRONTEND_URL` to that Netlify URL → **Manual Deploy**.
3. Netlify → **Deploys** → **Trigger deploy** → **Clear cache and deploy** (so `NEXT_PUBLIC_*` is rebuilt).

## If you still see “Page not found”

- **Publish directory** must be blank (not `.next`, not `out`).
- Trigger **Clear cache and deploy**.
- Check **Deploy log** — build must end with success, not failed plugin step.

## Demo checklist for your teacher

- Home page loads with books (needs API + MongoDB).
- Register / Login works (`FRONTEND_URL` must match Netlify URL exactly).
- Backend health: open `NEXT_PUBLIC_API_URL` in browser → `E-Commerce API is running`
