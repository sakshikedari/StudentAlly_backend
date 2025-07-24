const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const { authenticateAdmin, authorizeRole } = require("../middleware/authMiddleware");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, 
  },
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM donations ORDER BY id ASC");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching donations:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔓 Create a new donation initiative (public access)
router.post("/", async (req, res) => {
  try {
    const { title, description, goal, image, mobile, category } = req.body;

    if (!title || !description || !goal || !mobile || !category) {
      return res.status(400).json({ error: "All fields except 'image' are required" });
    }

    const result = await pool.query(
      "INSERT INTO donations (title, description, goal, image, mobile, category, raised) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *",
      [title, description, goal, image, mobile, category]
    );

    res.status(201).json({ message: "Donation initiative added successfully", donation: result.rows[0] });
  } catch (err) {
    console.error("Error adding donation initiative:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔐 Update raised amount (protected)
router.put(
  "/:id",
  authenticateAdmin,
  authorizeRole(["super_admin", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      let { raised } = req.body;

      raised = Number(raised);

      if (!raised || isNaN(raised) || raised <= 0) {
        return res.status(400).json({ error: "Raised amount must be a valid positive number" });
      }

      const result = await pool.query(
        "UPDATE donations SET raised = raised + $1 WHERE id = $2 RETURNING *",
        [raised, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Donation initiative not found" });
      }

      res.status(200).json({ message: "Raised amount updated successfully", donation: result.rows[0] });
    } catch (err) {
      console.error("Error updating donation:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// 🔐 Delete donation initiative (protected)
router.delete(
  "/:id",
  authenticateAdmin,
  authorizeRole(["super_admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const checkDonation = await pool.query("SELECT * FROM donations WHERE id = $1", [id]);
      if (checkDonation.rows.length === 0) {
        return res.status(404).json({ error: "Donation initiative not found" });
      }

      await pool.query("DELETE FROM donations WHERE id = $1", [id]);
      res.status(200).json({ message: "Donation initiative deleted successfully" });
    } catch (err) {
      console.error("Error deleting donation initiative:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// 🔓 Mentorship form (public)
router.post("/mentorship", async (req, res) => {
  try {
    const { name, email, expertise, sessionDate, sessionTopic } = req.body;

    if (!name || !email || !expertise || !sessionDate || !sessionTopic) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      "INSERT INTO mentorships (name, email, expertise, session_date, session_topic) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, expertise, sessionDate, sessionTopic]
    );

    res.status(201).json({ message: "Mentorship registration successful", mentorship: result.rows[0] });
  } catch (err) {
    console.error("Error in mentorship registration:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
