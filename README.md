🏙️ ConstructIQ — Enterprise Construction Intelligence Platform
Market-leading platform for construction project management. Evaluate budget health, discover operational bottlenecks using real-time analytics, and synchronize field data with an offline-capable Progressive Web App.

⚡ Quick Start
Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend development)
- Python 3.12 (for local backend development)

1. Clone & Configure
```bash
git clone https://github.com/kunjjadav/Construct-IQ.git
cd Construct-IQ
cp .env.example .env
```
*Edit `.env` with your secure credentials and database settings.*

2. Launch the Stack
```bash
docker-compose up --build
```
This starts 4 core services:

| Service | Port | Description |
|---|---|---|
| Frontend | `localhost:5173` | React PWA (Vite dev server) |
| Backend | `localhost:8000` | Django REST API |
| Admin | `localhost:8000/admin/` | Django Admin Dashboard |
| PostgreSQL | `5432` | Relational database |
| Redis | `6379` | Message broker & WebSockets cache |

3. Run Database Migrations
```bash
docker-compose exec backend python manage.py migrate
```

4. Create a Superuser
```bash
docker-compose exec backend python manage.py createsuperuser
```

🏗️ Architecture
```text
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   React PWA  │────│  Django DRF  │────│  PostgreSQL  │
│  + Zustand   │    │  + Celery    │    │  + RLS       │
│  + IndexedDB │    │  + Channels  │    │              │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
                    ┌──────┴───────┐
                    │    Redis     │
                    │  (Broker)    │
                    └──────────────┘
```

🔑 Key Features
- **Earned Value Management (EVM):** Real-time financial analytics, budget health tracking, and spend timelines.
- **Offline-First PWA & Batch Syncing:** Built as a Progressive Web App with IndexedDB and a dedicated background sync engine, allowing site officers to log data offline and batch-upload seamlessly.
- **Real-Time WebSockets:** Live notifications and operational "War Room" dashboard updates powered by Django Channels and Redis.
- **Document Management:** Centralized secure repository for construction documents, contracts, and compliance tracking.
- **Maintenance Kanban Boards:** Interactive drag-and-drop Kanban boards for tracking site maintenance tasks, defects, and issue resolution.
- **Field Reality Capture:** Built-in photo galleries, weekly log forms, and daily progress snapshots directly from the site.
- **Row-Level Security (RLS):** Database-level tenant isolation ensuring users can only access data belonging to their assigned projects.
- **Role-Based Access Control (RBAC):** Strict permissions dividing system access between Admins, Managing Agents, Clients, and Site Officers.
- **Financial Workflows:** Strict approval state machines for Change Orders, Requests for Information (RFIs), and Milestone completions.

📁 Core API Modules

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users/login/` | Authenticate and get JWT |
| `POST` | `/api/users/refresh/` | Refresh authentication token |
| `GET` | `/api/projects/` | List assigned projects and WBS hierarchies |
| `GET` | `/api/projects/{id}/financials/` | Fetch real-time EVM data |
| `POST` | `/api/change-orders/` | Submit and process financial Change Orders |
| `POST` | `/api/rfi/` | Submit and answer Requests for Information |
| `GET/POST` | `/api/documents/` | Upload and retrieve project documents |
| `GET/POST` | `/api/maintenance/` | Manage maintenance task Kanban cards |
| `GET/POST` | `/api/weekly-logs/` | Submit weekly site progress logs |
| `GET/POST` | `/api/photos/` | Upload and organize site reality photos |
| `POST` | `/api/sync/` | Batch synchronize offline PWA payloads |
| `WS` | `/ws/notifications/` | Real-time WebSocket connection |

🛠️ Tech Stack
- **Backend:** Django 5.x · DRF · PostgreSQL 16 · Celery · Redis 7 · Django Channels
- **Frontend:** React 18 · Vite · Zustand · Workbox (PWA) · Tailwind-inspired Custom CSS
- **Infra:** Docker Compose · Nginx · Gunicorn

📜 License
MIT © 2026 Kunj Jadav
