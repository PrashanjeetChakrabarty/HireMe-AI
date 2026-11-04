# Deployment

| Part | Where it runs | How it is updated |
| --- | --- | --- |
| Website (React, Vite) | Vercel | Automatically on every merge to `main`; a preview for every pull request |
| API (ASP.NET Core) | Azure App Service | The GitHub Action "Deploy backend" on every merge to `main` that changes the backend |
| Database | Azure SQL | EF Core migrations run when the API starts |
| AI service (FastAPI) | A Docker image on Docker Hub, run on Azure Container Apps | The image is rebuilt and pushed, then the container is updated |

## Settings (names only, never put values in Git)

API, as App Service settings:
`ConnectionStrings__DefaultConnection`, `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`, `Cors__AllowedOrigins` (addresses of the
website, separated by commas), `GoogleAuth__ClientId`, `Turnstile__SecretKey`, `AiService__BaseUrl`, `AiService__ApiKey`,
`SmtpSettings__Host`, `SmtpSettings__Username`, `SmtpSettings__Password`, `SmtpSettings__FromEmail`, `UPLOADS_PATH`.

Website, as Vercel environment variables: `VITE_API_URL`, `VITE_TURNSTILE_SITE_KEY`.

AI service: see `AiService/main.py` for the variable names it reads.

## Order for a risky change

1. Website changes that work with both the old and the new API.
2. New database columns (nullable or with a default).
3. The API change that uses them.

Merge only when the checks are green: `backend-tests` and `frontend-tests-and-build`.

## GitHub settings for the deploy workflow

Secret: `AZURE_WEBAPP_PUBLISH_PROFILE` (the publish profile of the App Service).

Variables (Settings, Secrets and variables, Actions, Variables): `AZURE_WEBAPP_NAME` (the name of the App Service) and
`API_URL` (the address of the API, without a slash at the end).

For the warmup script, copy `scripts/warmup.env.example` to `scripts/warmup.env` and put in your own addresses.
