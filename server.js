require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const pool = require('./config/pool');

// Routes
const jobRoutes = require("./routes/jobRoutes");
const eventRoutes = require("./routes/events");
const donationRoutes = require("./routes/donations");
const adminRoutes = require("./routes/adminRoutes");
const alumniRoutes = require("./routes/alumni");
const successStories=require("./routes/success");


//  Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());


pool.connect()
  .then(() => console.log("Connected to db"))
  .catch((err) => console.error("Database Connection Error:", err.message));


app.use("/success",successStories)
app.use("/alumni", alumniRoutes);
app.use("/admin", adminRoutes);
app.use("/admin/auth", require("./routes/adminAuthRoutes"));
app.use("/jobs", jobRoutes);
app.use("/events", eventRoutes);
app.use("/donations", donationRoutes);
app.use("/api/auth", require("./routes/authRoutes"));


app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running smoothly" });
});

app.get("/", (req, res) => {
  res.send("🚀 Backend is running on port 5000...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
