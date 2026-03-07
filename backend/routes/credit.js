const express = require("express");
const router = express.Router();
const db = require("../db"); // your MySQL connection
const authenticateUser = require("../middleware/auth");

// ===== GET ALL EMPLOYEES =====
router.get("/", authenticateUser, (req, res) => {
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = "SELECT * FROM credits ORDER BY id DESC";
  let params = [];

  // If not SUPER_ADMIN, strictly filter by branch_id
  if (userRole !== "SUPER_ADMIN") {
    sql = "SELECT * FROM credits WHERE branch_id = ? ORDER BY id DESC";
    params = [userBranchId];
  }

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch employees" });
    res.json(rows);
  });
});

// ===== ADD NEW EMPLOYEE =====
router.post("/", authenticateUser, (req, res) => {
  const { name, payment } = req.body;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  // Security: Managers cannot add staff natively.
  if (userRole === "MANAGER") {
    return res.status(403).json({ error: "Managers cannot add staff." });
  }

  if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
  if (payment === undefined || isNaN(Number(payment))) return res.status(400).json({ error: "Payment must be a valid number" });

  const sql = "INSERT INTO credits (name, payment, branch_id) VALUES (?, ?, ?)";
  // Always attach the modifying user's branch_id unless super admin logic dictates UI
  // Currently, we will strictly map the created staff to the user's branch context
  // SUPER_ADMIN might need a dynamic explicit Branch picker in the UI eventually, 
  // but we'll bind them to branch-001 or their native session ID right now.
  db.query(sql, [name.trim(), Number(payment), userBranchId], (err, result) => {
    if (err) {
      console.error("INSERT EMPLOYEE ERROR:", err);
      return res.status(500).json({ error: "Failed to add employee" });
    }

    // Return the newly inserted employee
    db.query("SELECT * FROM credits WHERE id=?", [result.insertId], (err2, rows) => {
      if (err2) return res.status(500).json({ error: "Failed to fetch new employee" });
      res.json(rows[0]);
    });
  });
});

module.exports = router;