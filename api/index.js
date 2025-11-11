require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const pool = require("../config/pool");
const serverless = require("serverless-http");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://student-ally-frontend.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

pool.connect()
  .then(() => console.log("Connected to PostgreSQL Database"))
  .catch((err) => console.error(" Database Connection Error:", err.message));

app.use("/success", require("../routes/success"));
app.use("/alumni", require("../routes/alumni"));
app.use("/admin", require("../routes/adminRoutes"));
app.use("/admin/auth", require("../routes/adminAuthRoutes"));
app.use("/jobs", require("../routes/jobRoutes"));
app.use("/events", require("../routes/events"));
app.use("/donations", require("../routes/donations"));
app.use("/api/auth", require("../routes/authRoutes"));

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running smoothly" });
});

app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully!");
});

module.exports = app;
module.exports.handler = serverless(app);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
