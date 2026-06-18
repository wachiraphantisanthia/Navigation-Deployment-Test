# Indoor Navigation System

This project contains:

- `backend/` → FastAPI + SQLite indoor navigation API
- `web-app/` → React + TypeScript web frontend for Admin and Kiosk

The frontend was converted from Flutter to React + TypeScript so it can work more naturally with browser DOM tools and WebAvatar integration.

## Backend

API base:
- http://127.0.0.1:8000

Swagger:
- http://127.0.0.1:8000/docs

Run backend:

```powershell
cd Web-Backend2
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:
- http://127.0.0.1:8000/health

## Frontend

Run frontend:

```powershell
cd Web-Backend2\web-app
npm install
npm run dev
```

Frontend dev server:
- http://127.0.0.1:5173

Main routes:
- http://127.0.0.1:5173/admin
- http://127.0.0.1:5173/kiosk

## What the React frontend includes

### Admin Web
- floor map upload and resize
- zoom / pan
- add, edit, delete, hide, and move nodes
- add, edit, delete, and hide edges
- category management
- kiosk management
- route simulation
- search
- node / edge counters
- save graph button
- semantic ids for future WebAvatar tools

### Kiosk Web
- home page
- category browsing
- destination browsing
- destination detail page
- route preview
- step-by-step path cards
- optional WebAvatar embedding slot

## Notes

- The backend FastAPI project is preserved.
- The React frontend consumes the existing API endpoints.
- WebAvatar can be enabled later with environment variables in `web-app/.env.local`.
