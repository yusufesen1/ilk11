import express from "express";
import { Pool } from "pg";

const app = express();

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

app.listen(3000, () => {
  console.log("ilk11-api çalışıyor: http://localhost:3000");
});