require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : req.cookies?.token;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function authorizeRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.admin) return res.status(401).json({ error: "Unauthorized" });
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

module.exports = { authenticateAdmin, authorizeRole };
