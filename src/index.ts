import express from "express";
import { Pool } from "pg";

const app = express();
app.use(express.json());

// Docker'daki veritabanına bağlantı
const pool = new Pool({
  host: "localhost",
  port: 5433,
  user: "ilk11",
  password: "ilk11",
  database: "ilk11",
});

// Örnek: /matches/nearby?lat=38.4370&lng=27.1430&radius=5000
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

  const { rows: notifiedUsers } = await pool.query(
    `SELECT u.id, u.name,
            round(ST_Distance(u.location, m.location))::int AS distance_m
     FROM users u
     JOIN matches m ON m.id = $1
     WHERE ST_DWithin(u.location, m.location, 3000)
     ORDER BY distance_m`,
    [match.id]
  );

  for (const u of notifiedUsers) {
    console.log(`🔔 ${u.name} (${u.distance_m} m): "${match.title}" maçında ${match.missing_players} kişi eksik!`);
  }

  res.status(201).json({ match, notified: notifiedUsers });
});

// Örnek: /matches/6/nearby-users?radius=3000
app.get("/matches/:id/nearby-users", async (req, res) => {
  const matchId = Number(req.params.id);
  const radius = Number(req.query.radius ?? 3000);

  const { rows } = await pool.query(
    `SELECT u.id, u.name,
            round(ST_Distance(u.location, m.location))::int AS distance_m
     FROM users u
     JOIN matches m ON m.id = $1
     WHERE ST_DWithin(u.location, m.location, $2::float8)
     ORDER BY distance_m`,
    [matchId, radius]
  );

  res.json(rows);
});

app.listen(3000, () => {
  console.log("ilk11-api çalışıyor: http://localhost:3000");
});