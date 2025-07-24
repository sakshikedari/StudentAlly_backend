const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, 
  },
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM alumni");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching alumni:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      graduation_year,
      profile_pic,
      bio,
      job_title,
      company,
      linkedin,
      github
    } = req.body;


    const newAlumni = await pool.query(
      `INSERT INTO alumni 
        (name, email, graduation_year, profile_pic, bio, job_title, company, linkedin, github) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [name, email, graduation_year, profile_pic, bio, job_title, company, linkedin, github]
    );

    res.status(201).json(newAlumni.rows[0]);
  } catch (err) {
    console.error(" Error adding alumni:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      graduation_year,
      profile_pic,
      bio,
      job_title,
      company,
      linkedin,
      github
    } = req.body;


    const updatedAlumni = await pool.query(
      `UPDATE alumni SET 
        name=$1, 
        email=$2, 
        graduation_year=$3, 
        profile_pic=$4, 
        bio=$5, 
        job_title=$6, 
        company=$7, 
        linkedin=$8, 
        github=$9 
      WHERE id=$10 RETURNING *`,
      [name, email, graduation_year, profile_pic, bio, job_title, company, linkedin, github, id]
    );

    if (updatedAlumni.rowCount === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(updatedAlumni.rows[0]);
  } catch (err) {
    console.error("Error updating alumni:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});


// Delete alumni
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteAlumni = await pool.query("DELETE FROM alumni WHERE id=$1 RETURNING *", [id]);

    if (deleteAlumni.rowCount === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({ message: "Profile deleted successfully" });
  } catch (err) {
    console.error(" Error deleting alumni:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});


module.exports = router;
