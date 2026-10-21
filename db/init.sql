CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE matches (
  id              SERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  pitch_name      TEXT NOT NULL,
  location        GEOGRAPHY(Point, 4326) NOT NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  missing_players INT NOT NULL CHECK (missing_players > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Yakınlık sorgularını hızlandıran mekansal index
CREATE INDEX matches_location_idx ON matches USING GIST (location);

-- Test verisi (İzmir). DİKKAT: ST_MakePoint(boylam, enlem) — sıra lng, lat
INSERT INTO matches (title, pitch_name, location, starts_at, missing_players) VALUES
  ('Akşam maçı, 2 kişi lazım', 'Bornova Halısaha',   ST_SetSRID(ST_MakePoint(27.2160, 38.4620), 4326)::geography, now() + interval '3 hours', 2),
  ('Kaleci aranıyor',          'Buca Spor Tesisi',   ST_SetSRID(ST_MakePoint(27.1700, 38.3880), 4326)::geography, now() + interval '1 day',   1),
  ('7v7 eksik var',            'Karşıyaka Halısaha', ST_SetSRID(ST_MakePoint(27.1100, 38.4600), 4326)::geography, now() + interval '5 hours', 3),
  ('Sabah maçı',               'Alsancak Arena',     ST_SetSRID(ST_MakePoint(27.1430, 38.4370), 4326)::geography, now() + interval '2 days',  2),
  ('Uzak maç (Çeşme)',         'Çeşme Halısaha',     ST_SetSRID(ST_MakePoint(26.3050, 38.3240), 4326)::geography, now() + interval '1 day',   4);
