# DJMGR DJ Career Survey

A self-hosted survey tool with branching logic and a reporting dashboard.

## What it includes

- **Survey** (`/`) — 10-step form with branching based on management status. Dark branded design.
- **Admin dashboard** (`/admin`) — password-protected reporting with charts, individual response viewer, and CSV export.
- **Backend** — Node.js + Express + SQLite. No external database required.

---

## Local setup (for testing)

1. Make sure you have Node.js 18+ installed
2. Run the following commands:

```bash
npm install
cp .env.example .env
# Edit .env to set your ADMIN_PASSWORD
npm start
```

3. Open http://localhost:3000 for the survey
4. Open http://localhost:3000/admin for the dashboard

---

## Deploying to Railway (recommended — free to start)

1. Create a free account at railway.app
2. Create a new project and choose "Deploy from GitHub"
3. Push this folder to a GitHub repo and connect it
4. In Railway, go to Variables and add:
   - `ADMIN_PASSWORD` — something strong, e.g. `djmgr-2026-admin`
   - `PORT` — Railway sets this automatically, you can skip it
5. Deploy. Railway will run `npm start` automatically.

Your survey will be live at the Railway URL within 2 minutes.

---

## Deploying to Render (alternative — also free)

1. Create account at render.com
2. New > Web Service > Connect your GitHub repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables: `ADMIN_PASSWORD`
6. Deploy

---

## Important notes

**Database**: SQLite stores all responses in a `djmgr.db` file on the server. Railway and Render have ephemeral filesystems — if the server restarts, the database may be wiped. For production use with real data, either:
- Add a persistent disk volume in Railway (available on paid plans), or
- Switch to a hosted PostgreSQL database (the code can be adapted)

For the initial 50-100 interview responses this is fine. You can export to CSV anytime.

**Admin password**: Set this in your .env file or Railway/Render environment variables. Default is `djmgr-admin` which you should change immediately.

**Custom domain**: Both Railway and Render let you add a custom domain (e.g. survey.djmgr.com) from the settings panel.

---

## File structure

```
djmgr-survey/
├── server.js          — Express backend, API routes, SQLite
├── package.json       — Dependencies
├── .env.example       — Environment variable template
└── public/
    ├── survey.html    — The DJ survey (10 steps, branching)
    └── admin.html     — Results dashboard with charts
```

---

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/submit | None | Save a survey response |
| GET | /api/stats | Admin | Aggregated stats + all responses |
| GET | /api/export | Admin | Download all responses as CSV |
| GET | /api/health | None | Server health check |

Admin endpoints require the header `x-admin-password: YOUR_PASSWORD`.
