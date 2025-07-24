require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");
const jobRoutes = require("./routes/jobRoutes");
const eventRoutes=require("./routes/events");
const donationRoutes = require("./routes/donations");
const adminRoutes = require("./routes/adminRoutes");
const alumniRoutes=require("./routes/alumni.js")

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, // Required for Render's SSL
  },
});

// Check Database Connection
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ Database Connection Error:", err.stack));


app.get("/success-stories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM success_stories");

    const formattedData = result.rows.map(story => ({
      ...story,
      achievements: story.achievements, // No need for JSON.parse, it's already JSON
    }));

    res.json(formattedData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/success-stories", async (req, res) => {
  try {
      const { name, graduation_year, title, image, summary, achievements } = req.body;

      // Convert achievements into a proper JSON array (ensure it is an array)
      const formattedAchievements = Array.isArray(achievements) 
          ? JSON.stringify(achievements)  // Convert array to JSON string
          : JSON.stringify([achievements]); // Convert single value to array JSON

      const newStory = await pool.query(
          "INSERT INTO success_stories (name, graduation_year, title, image, summary, achievements) VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING *",
          [name, graduation_year, title, image, summary, formattedAchievements]
      );

      res.status(201).json(newStory.rows[0]);
  } catch (err) {
      console.error("Server Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use("/alumni",alumniRoutes);

app.use("/admin", adminRoutes);
app.use("/admin/auth", require("./routes/adminAuthRoutes"));

app.use("/jobs", jobRoutes);

app.use("/events", eventRoutes);

app.use("/donations", donationRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running smoothly" });
});

app.get("/", (req, res) => {
  res.send("🚀 Backend is running on port 5000...");
});

app.use("/api/auth", require("./routes/authRoutes"));

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
