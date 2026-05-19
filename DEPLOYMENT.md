# Deploy BookBazaar to Railway

This app runs as **two Railway services** (backend API + Next.js frontend) plus **MongoDB** (Atlas or Railway plugin).

Repository: [NabahatZehra/bookbazaar](https://github.com/NabahatZehra/bookbazaar)

## 1. MongoDB

Use one of:

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier) — copy the connection string into `MONGO_URI`
- Railway dashboard → **New** → **Database** → **MongoDB** — use the generated `MONGO_URL` as `MONGO_URI` on the backend service

## 2. Create a Railway project

1. Sign in at [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Select `NabahatZehra/bookbazaar` (authorize GitHub if prompted)

## 3. Backend service

1. In the project, open the service created from the repo (or **Add Service** → same repo)
2. **Settings** → **Source** → **Root Directory**: `backend`
3. **Settings** → **Networking** → **Generate Domain** (e.g. `https://bookbazaar-api-production.up.railway.app`)
4. **Variables** — set:

| Variable | Example / notes |
|----------|-----------------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas or Railway Mongo connection string |
| `JWT_SECRET` | Long random string |
| `FRONTEND_URL` | Frontend Railway URL (set after step 4) |
| `STRIPE_SECRET_KEY` | `sk_test_...` or live key |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook pointing to `https://<backend>/api/payments/webhook` |
| `STRIPE_CURRENCY` | `pkr` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | |
| `GEMINI_API_KEY` | Optional; chatbot falls back if missing |

`PORT` is set automatically by Railway — do not override unless needed.

5. Deploy (**Deployments** tab should show a successful build)

## 4. Frontend service

1. **Add Service** → **GitHub Repo** → same `bookbazaar` repo
2. **Root Directory**: `frontend`
3. **Generate Domain** for the frontend
4. **Variables** (required **before** build — Next.js bakes `NEXT_PUBLIC_*` at build time):

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | Backend public URL from step 3 (no trailing slash) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `SITE_URL` | Frontend public URL (for sitemap) |

5. **Redeploy** the frontend after setting variables (or set them before the first deploy).

## 5. Link backend ↔ frontend

1. On the **backend** service, set `FRONTEND_URL` to the frontend domain (e.g. `https://bookbazaar-web-production.up.railway.app`)
2. Redeploy the backend so CORS and cookies use the correct origin.

## 6. Stripe webhook (optional for payments)

In [Stripe Dashboard](https://dashboard.stripe.com/webhooks):

- Endpoint URL: `https://<your-backend-domain>/api/payments/webhook`
- Copy the signing secret into backend `STRIPE_WEBHOOK_SECRET`

## 7. Seed admin (optional)

From your machine with `MONGO_URI` pointing at production:

```bash
cd backend
npm install
# set MONGO_URI in .env temporarily
node seedAdmin.js
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login works locally but not on Railway | Ensure `FRONTEND_URL` matches the frontend URL exactly; redeploy backend after changing it |
| API 404 / CORS errors | `NEXT_PUBLIC_API_URL` must be the backend URL; redeploy frontend |
| Build fails on frontend | Set `NEXT_PUBLIC_API_URL` and redeploy |
| Images from API uploads | Prefer Cloudinary; local `/uploads` are ephemeral on Railway |

## CLI (optional)

```bash
npm i -g @railway/cli
railway login
cd backend && railway link
railway up
```

Repeat with `cd frontend` for the second service.
