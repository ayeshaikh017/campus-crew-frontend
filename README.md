<<<<<<< HEAD
# CampusCrew Frontend

Responsive React 18 + Vite frontend for the supplied CampusCrew backend. Uses Tailwind CSS 3, React Router 6, Axios and Socket.IO client dependency. The UI uses a hand-crafted editorial style, responsive layouts, and CSS-drawn artwork rather than stock dashboard templates.

## Requirements
- Node.js 20 or newer
- CampusCrew backend running on `http://localhost:5000`

## Install and run (PowerShell)
From this extracted `campuscrew-frontend` directory:

```powershell
Copy-Item .env.example .env
=======
# CampusCrew Backend

Node.js + Express + MongoDB/Mongoose API for the CampusCrew college volunteer and event coordination app. No Flutter, Docker, Redis, or Python required.

## Requirements
- Node.js 20+
- npm
- MongoDB local or MongoDB Atlas connection string

## Windows PowerShell quick start
```powershell
cd campuscrew-backend
Copy-Item .env.example .env
notepad .env
npm install
npm run dev
```
Edit `.env` and set `MONGODB_URI` plus a strong random `JWT_SECRET` (at least 32 characters). For local MongoDB use `mongodb://127.0.0.1:27017/campuscrew`. For Atlas paste your connection string. Leave `SMTP_HOST` empty during development; registration/reset OTPs appear in this terminal.

In another PowerShell window, verify:
```powershell
Invoke-RestMethod http://localhost:5000/api/health
```
Expected shape: `success = True`, message `CampusCrew API is healthy`.

## macOS/Linux quick start
```bash
cd campuscrew-backend
cp .env.example .env
# Edit .env and set MONGODB_URI and JWT_SECRET
>>>>>>> e06fb085fd42e64b49e23548261fe6d1a832e0d6
npm install
npm run dev
```

<<<<<<< HEAD
Open `http://localhost:5173`.

## Backend configuration
In the backend `.env`, make sure the client origin matches exactly:

```env
CLIENT_ORIGIN=http://localhost:5173
```

Restart the backend after changing `.env`. The frontend uses `VITE_API_BASE_URL=http://localhost:5000/api/v1` and `VITE_SOCKET_URL=http://localhost:5000` by default. If your backend uses another port, edit the frontend `.env` and restart Vite.

## Features included
- Login, registration, email OTP verification, forgot/reset password
- Cookie-based authentication (`withCredentials: true`); no JWT in localStorage
- Dashboard, event discovery/search/category filters, event detail and participant/volunteer registration
- Volunteer task list and status updates
- Public student directory search
- Notifications and mark-as-read actions
- Profile editing
- Coordinator/admin event creation, proposal decisions, basic reports and stats views
- Responsive mobile navigation and layouts from 320px upward

## Important notes
- Email OTP development flow follows the backend guide: if `SMTP_HOST` is empty, read the OTP from the backend terminal.
- The frontend does not replace backend authorization. The API remains authoritative; inaccessible data and API errors are shown in the UI.
- Socket.IO is included as a dependency but REST remains authoritative; this baseline currently refreshes data on page loads/actions rather than wiring every live socket event. Add socket listeners and reconnect polling before production if live updates are a requirement.
- This project has not been security-audited or tested against a live configured backend. Verify the complete auth/event/task/admin flows locally before deployment.
=======
## Seed demo data
```powershell
npm run seed
# Destructive reset of demo collections, then reseed:
npm run seed:reset
```
All demo passwords: `Demo@12345`. Demo emails are listed in the seed command output. Do not run reset against a database containing real data.

## Useful commands
- `npm run dev` — development server with nodemon
- `npm start` — start server
- `npm run check` — syntax-check the server/app entry points
- `npm test` — Node test runner
- `npm run seed` — idempotent demo seed
- `npm run seed:reset` — clear seeded app collections and reseed

## API
- Health: `GET /api/health`
- App API prefix: `/api/v1`
- API response contract: `{ success, message, data }`
- Frontend contract and all implemented endpoint bodies: [`docs/FRONTEND_GUIDE.md`](docs/FRONTEND_GUIDE.md)

## SMTP (optional)
For Gmail, enable 2-step verification and create a Google App Password. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_USER=your Gmail`, `SMTP_PASS=your App Password`, and `MAIL_FROM` to your sender address. Never commit `.env` or expose credentials in frontend code.

## Local mobile-device testing
Use your computer's LAN IP (for example `http://192.168.1.20:5000`) and permit the port in the firewall. Update `CLIENT_ORIGIN` to the exact frontend origin. Production cookies/PWA require HTTPS; a plain LAN URL is not a production deployment.

## Deployment outline
- MongoDB Atlas for database
- Render (or another Node host) for API
- Vercel (or another static host) for React/Vite frontend
- Set production environment variables, exact `CLIENT_ORIGIN`, secure cookie settings, SMTP, and HTTPS URLs.

## Security and limitations
This is a starter baseline and needs testing/hardening before real users. See the limitations section in `docs/FRONTEND_GUIDE.md`. Do not use the demo credentials in production. Email OTP verifies mailbox control, not college ID authenticity; use an official college roster/admin review if identity verification is required.
>>>>>>> e06fb085fd42e64b49e23548261fe6d1a832e0d6
