const jwt = require("jsonwebtoken");

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.role) {
      return res.status(403).json({ error: "Invalid token structure" });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

const authorizeRole = (allowedRoles) => (req, res, next) => {

  if (!req.admin) {
    return res.status(403).json({ error: "Access denied. No admin data." });
  }

  const { role } = req.admin;

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: "Access denied. Insufficient permissions." });
  }

  next();
};

module.exports = { authenticateAdmin, authorizeRole,};
