# ilk11-api

Backend for **ilk11**, a pickup football app that helps fill empty spots in local matches.
A user posts a match with a location, and nearby players (within ~3 km) are found and notified.

## Tech stack

- **Node.js + TypeScript** (Express)
- **PostgreSQL + PostGIS** for geospatial queries (`ST_DWithin`, `ST_Distance`, GiST indexes)
- **Docker Compose** for the database

## Getting started

```bash
# 1. Start the database (PostGIS on port 5433)
docker compose up -d

# 2. Install dependencies
npm install

# 3. Run the API (http://localhost:3000)
npm run dev
```

The database schema and sample data (Izmir) are created automatically from `db/init.sql` on first start.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/matches/nearby?lat=&lng=&radius=` | Matches within `radius` meters of a location (default 3000) |
| GET | `/matches/:id/nearby-users?radius=` | Users within `radius` meters of a match |
| POST | `/matches` | Create a match and find nearby users to notify |

### Example: create a match

```bash
curl -X POST http://localhost:3000/matches \
  -H "Content-Type: application/json" \
  -d '{"title":"Evening match","pitch_name":"Alsancak Arena","lat":38.4370,"lng":27.1430,"starts_at":"2026-10-22T21:00:00+03:00","missing_players":3}'
```

Response:

```json
{
  "match": { "id": 7, "title": "Evening match", "missing_players": 3, "...": "..." },
  "notified": [
    { "id": 1, "name": "Ahmet", "distance_m": 207 },
    { "id": 2, "name": "Mehmet", "distance_m": 2530 }
  ]
}
```

## Roadmap

- [x] Geospatial match search
- [x] Find nearby users when a match is created
- [ ] Environment variables for config
- [ ] User auth
- [ ] Push notifications
- [ ] Mobile app