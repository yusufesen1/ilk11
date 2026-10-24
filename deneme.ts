app.post("/users", async (req, res) => {
    const {name, lat, lng} = req.body ?? {};

    if (!name || lat === undefined || lng === undefined) {
        res.status(400).json({error: "eksik alan var"});
        return;
    }

    const {rows} = await pool.query(
        `INSERT INTO users (name, location)
         VALUES ($1, ST_SetSRID(ST_MakePoint($2::float8, $3::float8), 4326))
         RETURNING id, name, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng`,
        [name, lng, lat]
    );
    res.status(201).json(rows[0]);
});
