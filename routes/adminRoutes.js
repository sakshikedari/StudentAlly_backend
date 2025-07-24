const express = require("express");
const { authenticateAdmin, authorizeRole } = require("../middleware/authMiddleware");
const { Pool } = require("pg");
require("dotenv").config();

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, 
  },
});


router.get("/all-users", authenticateAdmin, authorizeRole(["superadmin"]), async (req, res) => {
  try {

    const adminResult = await pool.query("SELECT id, name, email, role FROM admin");

    const userResult = await pool.query(`
      SELECT id, name, email, 
        CASE 
          WHEN role = 'alumni' THEN 'alumni'
          WHEN role = 'student' THEN 'student'
          ELSE 'unknown'
        END AS role
      FROM users
    `);

    const allUsers = [...adminResult.rows, ...userResult.rows];

    res.json(allUsers);
  } catch (error) {
    console.error(" Error fetching users and admins:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/filtered", authenticateAdmin, async (req, res) => {
  try {
    const adminRole = req.admin.role; 

    if (adminRole === "superadmin") {
      const result = await pool.query("SELECT id, name, email, role FROM admin");
      return res.json(result.rows);
    } else if (adminRole === "admin") {
      const result = await pool.query("SELECT id, name, email, role FROM admin WHERE role = 'moderator'");
      return res.json(result.rows);
    } else if (adminRole === "moderator") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.status(403).json({ error: "Unauthorized access" });
  } catch (error) {
    console.error("Error fetching filtered admins", error);
    res.status(500).json({ error: "Server error" });
  }
});


router.delete("/delete/:id", authenticateAdmin, authorizeRole(["superadmin"]), async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM admin WHERE id = $1", [id]);
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
