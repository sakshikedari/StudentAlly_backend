const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { body, validationResult } = require("express-validator");

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

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


// router.post(
//   "/register",
//   [
//     body("name").notEmpty().withMessage("Name is required"),
//     body("email").isEmail().withMessage("Valid email is required"),
//     body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     const { name, email, password, role = "student" } = req.body;

//     try {
//       const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
//       if (existingUser.rows.length > 0) {
//         return res.status(400).json({ error: "Email already registered" });
//       }

//       const hashedPassword = await hashPassword(password);

//       const newUser = await pool.query(
//         "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
//         [name, email, hashedPassword, role]
//       );

//       res.status(201).json({ message: "User registered successfully!", user: newUser.rows[0] });
//     } catch (error) {
//       console.error("Registration Error:", error);
  
//       res.status(500).json({ error: "Internal server error" });
//     }
//   }
// );

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
      console.log("Register Input:", { name, email, password, role }); // 👈 Debug input

      const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      console.log("Existing User Query Result:", existingUser.rows); // 👈 Debug query result

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      console.log("Hashed Password:", hashedPassword); // 👈 Debug hash

      const newUser = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
        [name, email, hashedPassword, role]
      );

      console.log("Inserted User:", newUser.rows[0]); // 👈 Debug insert

      res.status(201).json({ message: "User registered successfully!", user: newUser.rows[0] });
    } catch (error) {
      console.error("❌ Registration Error Stack Trace:", error.stack); // 👈 full error with line number
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// 🔑 LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
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

module.exports = router;
