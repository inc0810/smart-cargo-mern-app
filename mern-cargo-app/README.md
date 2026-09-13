# 🚢 Smart Cargo Management System (MERN Stack)

A full-stack app for registering, tracking, and placing cargo containers on a ship — built with **MongoDB, Express, React, and Node.js**, matching the hackathon problem statement.

## Features

- Register cargo/container details (ID, size, weight, type, destination)
- Assign containers to a position on the ship (bay / row / tier)
- Track status: Registered → Loaded → In Transit → Unloaded
- Search and filter containers instantly
- Cargo summary/report (by status, type, destination, total weight, occupancy)
- Alerts for overweight cargo and incorrect stacking/placement
- **AI-based placement suggestion** — a rule-based heuristic engine that recommends the best ship slot for a container based on weight (stability), unloading order (accessibility), cargo type (Reefer/Hazardous zoning), and weight balance across the ship
- Visual ship map (bay × row grid, per tier)

## Tech Stack

- **Frontend:** React (React Router, Axios) — plain CSS, no UI framework needed
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)

> The problem statement suggested MySQL; this build uses MongoDB since you asked for the **MERN** stack. Swapping to MySQL/Sequelize later only requires changing the `models/` and `config/db.js` files — the API routes and React frontend stay the same.

## Project Structure

```
mern-cargo-app/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── models/Container.js       # Mongoose schema
│   ├── controllers/containerController.js
│   ├── routes/containerRoutes.js
│   ├── utils/placementEngine.js  # "AI" placement heuristic
│   ├── server.js
│   └── package.json
└── frontend/
    ├── public/index.html
    └── src/
        ├── api/api.js             # Axios client
        ├── components/            # Sidebar, StatusBadge
        ├── pages/                 # Dashboard, ContainerList, AddContainer,
        │                          #   ContainerDetail, ShipMap, AIPlacement, Reports
        ├── styles/index.css
        ├── App.js
        └── index.js
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas connection string

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # edit MONGO_URI if needed
npm run dev                # or: npm start
```

Backend runs at `http://localhost:5000`. Test it: `GET http://localhost:5000/` should return a JSON status message.

### 2. Frontend

In a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000` and talks to the API at `http://localhost:5000/api` by default (override with a `REACT_APP_API_URL` env var if needed).

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/containers` | Register a new container |
| GET | `/api/containers?search=&status=&type=&destination=` | List/search containers |
| GET | `/api/containers/:containerId` | Get one container |
| PUT | `/api/containers/:containerId` | Update container details/status |
| DELETE | `/api/containers/:containerId` | Delete a container |
| POST | `/api/containers/:containerId/place` | Set/apply a position `{bay,row,tier}` |
| POST | `/api/containers/suggest-placement` | AI placement suggestion (`{containerId}` or hypothetical `{weight,type,size,unloadingPriority}`) |
| GET | `/api/containers/report/summary` | Cargo summary report |
| GET | `/api/containers/alerts` | Overweight / placement-issue alerts |

## How the "AI" placement works

`backend/utils/placementEngine.js` scores every free ship slot for a container using weighted rules:

1. **Stability** — heavier containers are pulled toward lower tiers.
2. **Accessibility** — containers with an earlier unloading priority are pushed toward higher/easier-to-reach tiers.
3. **Zoning** — Reefer containers are pulled toward the powered reefer bay; Hazardous containers are isolated in a dedicated bay.
4. **Balance** — bays and rows with less existing weight are preferred, to keep the ship trim and level.

It also flags **overweight** cargo (over the configured max slot weight) and **incorrect stacking** (a heavier container placed above a lighter one).

This is intentionally a transparent, swappable module — it can be replaced later with a trained ML model without changing any other part of the app.

## Next steps / ideas

- Add authentication (per-shipping-company accounts)
- Persist a full audit log of load/unload events
- Export the summary report as PDF
- Replace the heuristic with a trained ML placement model
