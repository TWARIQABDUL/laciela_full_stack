const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const dbPromise = db.promise();
    const [rows] = await dbPromise.query("SELECT * FROM users WHERE username = ? AND status = 'active'", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = rows[0];

    // Block EMPLOYEE role from logging into the system
    if (user.role === 'EMPLOYEE') {
      return res.status(403).json({ error: "Access Denied. Employee accounts cannot log in." });
    }

    // Assuming plain text passwords for now based on previous seeding.
    // In production, compare with bcrypt: await bcrypt.compare(password, user.password)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate JWT token containing the user's role and branch ID
    const tokenPayload = {
      userId: user.userId,
      username: user.username,
      role: user.role,
      branchId: user.branch_id
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });

    // Set the token as an HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true in prod (HTTPS)
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return user info to frontend state
    return res.json({
      message: "Login successful",
      user: tokenPayload
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/verify
router.get("/verify", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "No token provided, user not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ user: decoded });
  } catch (err) {
    // Return 401 if invalid or expired
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.json({ message: "Logout successful" });
});

module.exports = router;
