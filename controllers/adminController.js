const pool = require("../config/pool");

async function getAllUsers(req, res) {
  try {
    const adminResult = await pool.query("SELECT id, name, email, role FROM admin");
    const userResult = await pool.query("SELECT id, name, email, role FROM users");
    res.json([...adminResult.rows, ...userResult.rows]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id, name, email", [id]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted", deleted: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getAllUsers, deleteUser };
