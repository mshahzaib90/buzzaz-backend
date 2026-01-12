# Deploying Buzzaz to Railway

This project is configured as a monorepo containing both the Frontend (React) and Backend (Node.js/Express). You will deploy them as two separate services within a single Railway project.

## Prerequisites
1.  **GitHub Account**: Ensure this code is pushed to a GitHub repository.
2.  **Railway Account**: Sign up at [railway.app](https://railway.app).

## Project Structure
-   `/frontend`: React application (deployed via `serve`).
-   `/backend`: Node.js/Express application (deployed via `npm start`).

## Step 1: Create a Project and Deploy Backend

1.  Log in to Railway and click **"New Project"**.
2.  Select **"Deploy from GitHub repo"**.
3.  Choose your repository.
4.  **CRITICAL STEP**: Before the first deployment builds, or immediately after (if it fails):
    *   Click on the new service.
    *   Go to **Settings**.
    *   Scroll down to **Root Directory**.
    *   Change it to `/backend`.
    *   Railway should automatically detect the `Procfile` and use `npm start`.
5.  **Add a Database**:
    *   In the project view, right-click (or click "New") -> **Database** -> **PostgreSQL**.
    *   This will automatically add a `DATABASE_URL` variable to your services.
    *   **Link the Database**: Go to your Backend Service -> **Variables**. Ensure `DATABASE_URL` is present. If not, reference the Postgres variable (e.g., `${Postgres.DATABASE_URL}`).

### Backend Environment Variables
Go to the Backend Service -> **Variables** and add the following:

-   `JWT_SECRET`: A long random string (e.g., generated via `openssl rand -hex 32`).
-   `NODE_ENV`: `production`
-   `PGSSL`: `true`
-   `FIREBASE_SERVICE_ACCOUNT`: Your Firebase Service Account JSON (minified/single line).
-   `APIFY_TOKEN`: Your Apify token.
-   `YOUTUBE_API_KEY`: Your YouTube Data API Key.
-   `CRON_SECRET`: A secret string for protecting cron endpoints.
-   `EMAIL_USER` / `EMAIL_PASS`: For sending emails.
-   `PORT`: `5000` (Optional, Railway assigns one automatically, but good to be explicit).

### Important Note on File Uploads
By default, Railway file systems are **ephemeral**. This means if you restart or redeploy the backend, any files uploaded to the local `uploads/` folder will be **deleted**.
-   **Solution**: For production, it is highly recommended to use an external object storage service like AWS S3, Cloudinary, or Google Cloud Storage.
-   **For now**: The code is configured to save to disk (`/uploads`), which works but files won't persist across deployments.

## Step 2: Deploy Frontend

1.  In the same Railway project, click **"New"** -> **"GitHub Repo"**.
2.  Select the **same repository** again.
3.  Go to this new service's **Settings**.
4.  Change **Root Directory** to `/frontend`.
5.  Railway should detect the `Procfile` and use `npx serve -s build -l $PORT`.
6.  Go to **Variables** and add:
    -   `REACT_APP_API_URL`: The URL of your Backend service.
        *   **Find this URL**: Go to Backend Service -> Settings -> Networking -> Public Domain.
        *   Example: `https://backend-production.up.railway.app` (No trailing slash).

## Step 3: Connect and Finalize

1.  Copy the **Public Domain** of your **Frontend Service** (e.g., `https://frontend-production.up.railway.app`).
2.  Go back to the **Backend Service** -> **Variables**.
3.  Add/Update `FRONTEND_ORIGIN` with your Frontend URL.
4.  **Redeploy** the Backend service (it might restart automatically).

## Cron Jobs (Optional)

If you need scheduled tasks (e.g., syncing stats):
1.  Use Railway's Cron feature or an external cron service (like cron-job.org).
2.  Target Endpoint: `POST https://your-backend-url.up.railway.app/api/cron/sync-influencer-stats`
3.  Header: `X-Cron-Secret: <YOUR_CRON_SECRET>`

## Troubleshooting

-   **Build Fails**: Check the "Build Logs". Ensure dependencies are correct in `package.json`.
-   **CORS Errors**: 
    -   Check `FRONTEND_ORIGIN` in Backend variables matches the Frontend URL exactly.
    -   Check `REACT_APP_API_URL` in Frontend variables matches the Backend URL exactly.
-   **404 on API**: Ensure your Frontend is sending requests to `REACT_APP_API_URL/api/...`.
-   **Database Errors**: Ensure `DATABASE_URL` is set correctly and the Postgres service is running.
