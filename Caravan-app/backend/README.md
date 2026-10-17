# Caravan API backend

This is the Express/libSQL API from the `caravanBackend` repository. The Angular app calls it through the `/api` development proxy configured in the project root.

## Local setup

1. In this directory, install the backend dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill in `TURSO_LINK`, `TURSO_TOKEN`, and a private `JWT_SECRET`. The real `.env` is ignored by Git. Do not put database credentials in Angular environment files.
3. From the project root, run `npm start` to start both the API and Angular dev server together. The API listens on port 3000 and the app on port 8100.

You can also start them separately by running `npm start` in this directory and `npm run start:web` from the project root.

The API listens on `http://localhost:3000`; Angular proxies `/api` requests to it. The `/healthz` endpoint reports whether the API process is running. Database-backed API calls require valid Turso credentials.

## Android Studio local development

The Android app cannot use Angular's browser proxy. Start this API with `npm start`, then build and sync the app with `npm run android:sync:debug`. The Android emulator reaches the computer's API at `http://10.0.2.2:3000`; do not use `localhost` for API calls from the emulator. Check `http://localhost:3000/healthz` from the host first. Debug builds allow local HTTP only; keep production API URLs on HTTPS.

The app's development environment uses `http://10.0.2.2:3000` for Android emulator API requests and keeps relative `/api` paths for browser development. For a physical device, set `androidApiBaseUrl` in `src/environments/environment.ts` to the computer's LAN URL, for example `http://192.168.1.20:3000`, and ensure both devices share a network.

Google sign-in also needs the backend `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and an exact `GOOGLE_CALLBACK_URL` registered in Google Cloud. With the local callback `http://localhost:3000/api/auth/google/callback`, run `adb reverse tcp:3000 tcp:3000` from Android Studio's terminal so the emulator can reach the backend when Google redirects back. The login link passes the app's WebView origin (`http://localhost`) as a validated return target; keep this separate from the API host and do not change it to `10.0.2.2`. `FRONTEND_URL` remains the fallback origin.

PayPal checkout also requires a PayPal payment method in the `Payment_method` table and `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_API` in `.env`. Order confirmation email is optional and uses `EMAIL_USER` and `EMAIL_APP_PASSWORD`.

For deployment, configure these environment variables in the server environment and route the deployed app's `/api` requests to this backend. The local Angular proxy is only for development.
