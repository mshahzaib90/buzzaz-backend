# Deploying Buzzaz to Vercel

This project is configured to deploy a full-stack app on Vercel: a Create React App frontend and serverless API functions under `/api` that wrap the Express backend.

## Overview

- Static frontend build is produced at `frontend/build`.
- Serverless API endpoints live under `api/` and forward requests to the Express app in `backend/app.js`.
- Vercel configuration (`vercel.json`) sets the functions runtime to Node.js 20 and defines the build output directory.

## Vercel Project Settings

- Build Command: `npm run build`
- Output Directory: `frontend/build`
- Node.js Version: 20.x (functions runtime is set in `vercel.json`)

You can set these in the Vercel UI or rely on `vercel.json` which already specifies `buildCommand` and `outputDirectory`.

## Environment Variables

Set the following in Vercel → Project → Settings → Environment Variables:

Required:
- `DATABASE_URL` – Postgres connection string.
- `JWT_SECRET` – secure random string used for signing tokens.
- `FRONTEND_BASE_URL` – your deployed frontend URL, used in password reset links.
- `FRONTEND_ORIGIN` – same as your frontend URL for CORS in production.

Optional/feature-specific:
- `PGSSL` – generally not needed on Vercel; SSL is enabled automatically. Leave unset unless you need specific behavior.
- `DISABLE_FIREBASE` – set to `true` to disable Firebase-backed routes.
- `FIREBASE_SERVICE_ACCOUNT` – JSON string for Firebase Admin, if you use Firebase features.
- `APIFY_TOKEN` – for Apify integrations.
- `YOUTUBE_API_KEY` – YouTube Data API key; if missing, backend may serve mock data.
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SERVICE` – credentials for sending emails.

Frontend note: In production, the frontend defaults to same-origin `/api`, so you do not need `REACT_APP_API_URL`.

## Routing

- `api/index.js` handles `/api`.
- `api/[...path].js` handles any path under `/api/*`.
- All Express routes are mounted under `/api/*` in `backend/app.js`.

## Uploads

- Do not rely on local `/uploads` on Vercel; the filesystem is ephemeral.
- File uploads use memory storage (Multer) and are sent to Vercel Blob storage via `backend/services/blob.js`.
- Your API responds with Blob URLs which the frontend should display.

## Health Checks

After deployment, verify:
- `GET /api/health` → `{ status: "OK" }`
- `GET /api/health/datastore` → confirms Postgres connectivity
- `GET /api/email/health` → checks email transporter configuration

## Local Development vs Vercel

- Local dev servers:
  - Backend: `npm --prefix backend run dev` (nodemon on port 5000 by default)
  - Frontend: `npm --prefix frontend start` (CRA dev server on port 3000)
- Production on Vercel:
  - Frontend served from `frontend/build`.
  - API served from serverless functions under `/api`.

## Common Pitfalls

- Missing `Output Directory`: ensure Vercel knows to serve `frontend/build`.
- Firebase without credentials: set `DISABLE_FIREBASE=true` or provide `FIREBASE_SERVICE_ACCOUNT`.
- Hardcoded dev URLs: frontend code defaults to `/api` for production; avoid hardcoded `http://localhost`.

## Deployment Steps

1. Push your changes to the repository connected to Vercel.
2. In Vercel, create or open the project and ensure:
   - Build Command is `npm run build`.
   - Output Directory is `frontend/build`.
   - Environment variables are set.
3. Trigger a deployment. Once complete, visit your domain and test:
   - Frontend routes and authentication flows.
   - API health endpoints (`/api/health`, `/api/health/datastore`).
   - Any feature-specific endpoints (UGC, influencers, chat, email).

If you need separate projects (one for frontend, one for API), use monorepo settings or split into two Vercel projects, but the single-project setup above is recommended.

## Monorepo Root Directory and Install Command

Vercel lets you set a project Root Directory. In a monorepo, this affects how install/build commands resolve paths.

- Recommended: set Root Directory to the repository root so both `frontend/` and `api/` deploy.
- Clear any custom “Install Command” and “Build Command” in the Vercel dashboard so `vercel.json` is respected.

Our root `vercel.json` runs:

- `installCommand`: installs `frontend` and `backend` when present, and handles both repo root and alt layouts.
- `buildCommand`: `npm --prefix frontend run build`
- `outputDirectory`: `frontend/build`

If you set Root Directory to `frontend` (not recommended unless you only deploy the SPA):

- Ensure `frontend/vercel.json` exists (this repo includes it).
- Do NOT set a custom Install Command; Vercel will use `frontend/vercel.json`:
  - Installs `npm ci` in `frontend`.
  - Installs `npm --prefix ../backend ci` if `../backend/package.json` exists.
- Note: serverless `api/` in the repo root will not deploy when Root Directory is `frontend`.

If you must keep a custom Install Command, use a robust one that works from either root:

```sh
sh -c 'if [ -f ./frontend/package.json ]; then npm --prefix frontend ci; else npm ci; fi; if [ -f ./backend/package.json ]; then npm --prefix backend ci; elif [ -f ../backend/package.json ]; then npm --prefix ../backend ci; else echo "No backend/package.json found, skipping"; fi'
```

Symptom of misconfiguration:

- ENOENT like `/vercel/path0/backend/package.json` during install means the command was run from `frontend` root but referenced `backend` as a child instead of `../backend`.

