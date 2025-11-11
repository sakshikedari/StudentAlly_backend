// routes/adminRoutes.js
const express = require("express");
const pool = require("../config/pool");
const { authenticateAdmin, authorizeRole } = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

router.post("/register", authenticateAdmin, authorizeRole(["superadmin"]), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!(name && email && password && role)) return res.status(400).json({ error: "All fields are required" });

  try {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO admin (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, role]
    );
    res.status(201).json({ message: "Admin registered successfully!", admin: result.rows[0] });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/all-users", authenticateAdmin, authorizeRole(["superadmin"]), async (req, res) => {
  try {
    const adminResult = await pool.query("SELECT id, name, email, role FROM admin");
    const userResult = await pool.query("SELECT id, name, email, role FROM users");
    const allUsers = [...adminResult.rows, ...userResult.rows];
    res.json(allUsers);
  } catch (error) {
    console.error(" Error fetching users and admins:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/delete/:id", authenticateAdmin, authorizeRole(["superadmin"]), async (req, res) => {
  console.log("DELETE request received for ID:", req.params.id);
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM admin WHERE id = $1 RETURNING id, name, email", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Admin not found" });
    res.json({ message: "Admin deleted successfully", deleted: result.rows[0] });
  } catch (error) {
    console.error("Error deleting admin", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
