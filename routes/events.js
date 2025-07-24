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

// ✅ Get all events
router.get("/", async (req, res) => {
  try {
    const events = await pool.query("SELECT * FROM events ORDER BY date ASC");
    res.status(200).json(events.rows);
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Get single event by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const event = await pool.query("SELECT * FROM events WHERE id = $1", [id]);

    if (event.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json(event.rows[0]);
  } catch (error) {
    console.error("Error fetching event:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Create new event (public access)
router.post("/", async (req, res) => {
  try {
    const {
      title,
      date,
      time,
      location,
      type,
      description,
      registration_deadline,
      capacity,
      image,
    } = req.body;

    if (
      !title ||
      !date ||
      !time ||
      !location ||
      !type ||
      !description ||
      !registration_deadline ||
      !capacity
    ) {
      return res.status(400).json({ error: "All fields except 'image' are required" });
    }

    const newEvent = await pool.query(
      "INSERT INTO events (title, date, time, location, type, description, registration_deadline, capacity, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [title, date, time, location, type, description, registration_deadline, capacity, image]
    );

    res.status(201).json({ message: "Event created successfully", event: newEvent.rows[0] });
  } catch (error) {
    console.error("Error creating event:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Update event by ID (public access)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      date,
      time,
      location,
      type,
      description,
      registration_deadline,
      capacity,
      image,
    } = req.body;

    const eventCheck = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updatedEvent = await pool.query(
      `UPDATE events 
       SET title = $1, date = $2, time = $3, location = $4, type = $5, 
           description = $6, registration_deadline = $7, capacity = $8, image = $9 
       WHERE id = $10 RETURNING *`,
      [title, date, time, location, type, description, registration_deadline, capacity, image, id]
    );

    res.status(200).json({ message: "Event updated successfully", event: updatedEvent.rows[0] });
  } catch (error) {
    console.error("Error updating event:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Delete event by ID (public access)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const eventCheck = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    await pool.query("DELETE FROM events WHERE id = $1", [id]);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
