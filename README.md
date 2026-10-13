# CampusCrew Frontend

Responsive React 18 + Vite frontend for the supplied CampusCrew backend. Uses Tailwind CSS 3, React Router 6, Axios and Socket.IO client dependency. The UI uses a hand-crafted editorial style, responsive layouts, and CSS-drawn artwork rather than stock dashboard templates.

## Requirements
- Node.js 20 or newer
- CampusCrew backend running on `http://localhost:5000`

## Install and run (PowerShell)
From this extracted `campuscrew-frontend` directory:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

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
