import "dotenv/config";
import express from "express";
import { Pool } from "pg";

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- Yardımcı fonksiyon: bir maçın yakınındaki kullanıcılar ---
async function findNearbyUsers(matchId: number, radius = 3000) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name,
            round(ST_Distance(u.location, m.location))::int AS distance_m
     FROM users u
     JOIN matches m ON m.id = $1
     WHERE ST_DWithin(u.location, m.location, $2::float8)
     ORDER BY distance_m`,
    [matchId, radius]
  );
  return rows;
}

// --- Health check ---
app.get("/", (req, res) => {
  res.json({ app: "ilk11-api", status: "ok" });
});

// --- Bir konumun yakınındaki maçlar ---
app.get("/matches/nearby", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius ?? 3000);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400).json({ error: "lat ve lng gerekli" });
    return;
  }

  const { rows } = await pool.query(
    `SELECT id, title, pitch_name, starts_at, missing_players,
            round(ST_Distance(location, ST_MakePoint($2::float8, $1::float8)::geography))::int AS distance_m
     FROM matches
     WHERE ST_DWithin(location, ST_MakePoint($2::float8, $1::float8)::geography, $3::float8)
     ORDER BY distance_m`,
    [lat, lng, radius]
  );

  res.json(rows);
});

// --- Bir maçın yakınındaki kullanıcılar ---
app.get("/matches/:id/nearby-users", async (req, res) => {
  const matchId = Number(req.params.id);
  const radius = Number(req.query.radius ?? 3000);
  res.json(await findNearbyUsers(matchId, radius));
});

// --- Maç oluştur + yakındakilere "bildirim" ---
app.post("/matches", async (req, res) => {
  const { title, pitch_name, lat, lng, starts_at, missing_players } = req.body ?? {};

  if (!title || !pitch_name || lat === undefined || lng === undefined || !starts_at || !missing_players) {
    res.status(400).json({ error: "eksik alan var" });
    return;
  }

  const { rows } = await pool.query(
    `INSERT INTO matches (title, pitch_name, location, starts_at, missing_players)
     VALUES ($1, $2, ST_SetSRID(ST_MakePoint($4::float8, $3::float8), 4326)::geography, $5, $6)
     RETURNING id, title, pitch_name, starts_at, missing_players`,
    [title, pitch_name, lat, lng, starts_at, missing_players]
  );
  const match = rows[0];

  const notifiedUsers = await findNearbyUsers(match.id);
  for (const u of notifiedUsers) {
    console.log(`🔔 ${u.name} (${u.distance_m} m): "${match.title}" maçında ${match.missing_players} kişi eksik!`);
  }

  res.status(201).json({ match, notified: notifiedUsers });
});

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`ilk11-api çalışıyor: http://localhost:${port}`);
});