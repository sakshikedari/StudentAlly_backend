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

// GET all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await pool.query("SELECT * FROM jobs ORDER BY id DESC");
    res.status(200).json(jobs.rows);
  } catch (error) {
    console.error("Error fetching jobs:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST a new job (publicly accessible for logged-in users on frontend)
router.post("/", async (req, res) => {
  try {
    const { title, company, location, type, posted_by, description, job_link } = req.body;

    if (!title || !company || !location || !type || !posted_by || !description || !job_link) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newJob = await pool.query(
      `INSERT INTO jobs (title, company, location, type, posted_by, description, job_link) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, company, location, type, posted_by, description, job_link]
    );

    res.status(201).json(newJob.rows[0]);
  } catch (error) {
    console.error("Error adding job:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE job by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const job = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
    if (job.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    await pool.query("DELETE FROM jobs WHERE id = $1", [id]);
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
