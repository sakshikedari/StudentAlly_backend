const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require('../config/pool');

const { body, validationResult } = require("express-validator");

const router = express.Router();
require("dotenv").config();



const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

// 🔐 Hash Password
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error("Error hashing password");
  }
}

// 👤 REGISTER
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role = "student" } = req.body;

    try {
      const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);

      const newUser = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
        [name, email, hashedPassword, role]
      );

      res.status(201).json({ message: "User registered successfully!", user: newUser.rows[0] });
    } catch (error) {
      console.error("Registration Error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// 🔑 LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    console.log("DB Query Result:", userResult.rows);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email credentials" });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password credentials" });
    }

    // 🪙 Include role in token
    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign(tokenPayload, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "Strict" });

    res.json({
      message: "Login successful!",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔁 REFRESH TOKEN
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token: newToken });
  } catch (error) {
    res.status(403).json({ error: "Invalid refresh token" });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.token;
    if (!token) return res.status(200).json({ role: null }); // no user

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ id: decoded.id, email: decoded.email, role: decoded.role });
  } catch (err) {
    return res.status(200).json({ role: null });
  }
});

module.exports = router;
