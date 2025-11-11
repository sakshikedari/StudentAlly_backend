const express=require("express");
const router=express.Router();
const pool=require('../config/pool');

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM success_stories");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching success stories:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, graduation_year, title, image, summary, achievements } = req.body;

    const formattedAchievements = Array.isArray(achievements)
      ? JSON.stringify(achievements)
      : JSON.stringify([achievements]);

    const query = `
      INSERT INTO success_stories (name, graduation_year, title, image, summary, achievements)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      name,
      graduation_year,
      title,
      image,
      summary,
      formattedAchievements,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error adding success story:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;