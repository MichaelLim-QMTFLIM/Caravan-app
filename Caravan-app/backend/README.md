# Caravan API backend

This is the Express/libSQL API from the `caravanBackend` repository. The Angular app calls it through the `/api` development proxy configured in the project root.

## Local setup

1. In this directory, install the backend dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill in `TURSO_LINK`, `TURSO_TOKEN`, and a private `JWT_SECRET`. The real `.env` is ignored by Git. Do not put database credentials in Angular environment files.
3. Start the API with `npm start`.
4. In a second terminal, start the app from the project root with `ionic serve`.

The API listens on `http://localhost:3000`; Angular proxies `/api` requests to it. The `/healthz` endpoint reports whether the API process is running. Database-backed API calls require valid Turso credentials.

For deployment, configure these environment variables in the server environment and route the deployed app's `/api` requests to this backend. The local Angular proxy is only for development.
