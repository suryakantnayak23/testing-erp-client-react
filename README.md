# ERP Client (React)

> A simple ERP client built with React + Vite. This README explains how to run the project, useful credentials for quick testing, common routes, and troubleshooting (especially 401 / error boundary behavior).

---

## ✅ Quick overview

* Frontend: React (Vite)
* Purpose: Demo ERP UI with Login, Dashboard, User Info, Employees, Tasks, Calendar, etc.
* Note: Dashboard and User Info pages require authentication. When authentication fails you'll see the app's error boundary showing a **401** state.

---

## 🔑 Test credentials (use these to sign in locally / on staging)

* **Username:** `johndoe`
* **Password:** `asqw123`

> Use the app `/login` page and sign in with the above credentials for a quick demo.

---

## 🚪 Important pages / routes

* `/login` — Sign-in page
* `/dashboard` — Main dashboard (protected; needs auth)
* `/user-info` — User info list and profile (protected; needs auth)
* `/employees`, `/tasks`, `/calendar` — other management views (protected)

### User Info feature

* On the **User Info** page there is a button to **download users as an Excel file** (CSV/Excel). Use it to export the current user list.

---

## 🧭 Authentication & 401 / error boundary

* The app protects routes and uses an **error boundary** UI when authorization fails.
* If you see a **401 error boundary** after login or when visiting protected pages, check the following:

  1. Ensure the backend API URL is correct in your environment variables (see `.env` section).
  2. Verify the login request returns an auth token and that token is stored (typically in `localStorage` or a cookie depending on the project). Without the token the frontend will receive 401 from the API and show the error boundary.
  3. Token expiry — if the token expired, re-login to refresh it.
  4. CORS — if you run backend locally, enable CORS for your frontend origin.
  5. Inspect DevTools → Network to see the failing request and response body.

**Quick fix:** Open DevTools → Application → Local Storage and confirm there is a valid `authToken` (or the app's configured key). If missing, re-login.

---

## 🛠️ Environment variables

Create a `.env` (or `.env.local`) in the project root containing at least:

```text
VITE_API_BASE_URL=https://your-api.example.com
VITE_AUTH_STORAGE_KEY=authToken
# any other variables your project needs (file upload limits, feature flags, etc.)
```

Adjust variable names to match the project implementation.

---

## 📦 Install & run (local)

1. Install packages:

```bash
npm install
# or
yarn
```

2. Start dev server:

```bash
npm run dev
# or
yarn dev
```

3. Build for production:

```bash
npm run build
# or
yarn build
```

4. Preview production build locally (optional):

```bash
npm run preview
```

---

## 🚀 Deploy (Vercel / Netlify)

* For Vercel: set the build command to `npm run build` and publish the `dist` (or project's build) folder.
* Add your environment variables (`VITE_API_BASE_URL`, etc.) in the Vercel project settings.

---

## 🐞 Troubleshooting checklist (401-specific)

* Confirm login endpoint returns `200` and an auth token.
* Confirm the correct token key is stored where the frontend expects it (localStorage/cookie).
* Confirm protected requests include `Authorization: Bearer <token>` (or the header your API uses).
* If you see `401` only on Dashboard and User Info, but other pages load — those pages may be making additional protected calls; inspect network to find which call is failing.
* Check server logs for token validation errors.

---

## 🧾 Additional notes

* Everything is wrapped in an error boundary — unhandled exceptions and authorization errors will render a friendly error UI. This is intended for better UX but means you must resolve any 401 at the auth layer first.
* The project includes a user-export (Excel) from the **User Info** page — click the export/download button to get the file.

---

## 🤝 Contributing

If you want to improve the README, add steps for environment specific config, or document exact storage keys and headers, open a PR.

---

## 📬 Contact

If you need help running the project or debugging 401s, share the failing request (route + response) and I can help diagnose.

---

*Generated README for quick testing and onboa
