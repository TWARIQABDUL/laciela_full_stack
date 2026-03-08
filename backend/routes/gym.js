const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// ================= GET ALL GYM RECORDS (FILTER BY DATE) =================
router.get("/", authenticateUser, (req, res) => {
  const { date } = req.query;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = "SELECT * FROM gym WHERE 1=1";
  const params = [];

  if (date) {
    sql += " AND date = ?";
    params.push(date);
  }

  if (userRole !== "SUPER_ADMIN") {
    sql += " AND branch_id = ?";
    params.push(userBranchId);
  }

  sql += " ORDER BY date DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json({ records: rows });
  });
});

// ================= ADD GYM RECORD =================
router.post("/", authenticateUser, (req, res) => {
  let { date, daily_people, monthly_people, cash, cash_momo } = req.body;
  const userBranchId = req.user.branchId;

  if (!date) return res.status(400).json({ message: "Date is required" });

  daily_people = Number(daily_people || 0);
  monthly_people = Number(monthly_people || 0);
  cash = Number(cash || 0);
  cash_momo = Number(cash_momo || 0);
  const total_people = daily_people + monthly_people;

  const sql = `
    INSERT INTO gym
    (date, daily_people, monthly_people, total_people, cash, cash_momo, branch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [date, daily_people, monthly_people, total_people, cash, cash_momo, userBranchId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Gym record added", id: result.insertId });
  });
});

// ================= UPDATE GYM RECORD =================
router.put("/:id", authenticateUser, (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (userRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Edit access restricted to Super Admin. Please submit a Change Request." });
  }

  let { daily_people, monthly_people, cash, cash_momo } = req.body;

  daily_people = Number(daily_people || 0);
  monthly_people = Number(monthly_people || 0);
  cash = Number(cash || 0);
  cash_momo = Number(cash_momo || 0);
  const total_people = daily_people + monthly_people;

  let sql = `
    UPDATE gym
    SET daily_people=?, monthly_people=?, total_people=?, cash=?, cash_momo=?
    WHERE id=?
  `;
  let params = [daily_people, monthly_people, total_people, cash, cash_momo, id];

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Gym record updated successfully" });
  });
});

// ================= DELETE GYM RECORD =================
router.delete("/:id", authenticateUser, (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = "DELETE FROM gym WHERE id=?";
  let params = [id];

  if (userRole !== "SUPER_ADMIN") {
    sql += " AND branch_id = ?";
    params.push(userBranchId);
  }

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Gym record deleted successfully" });
  });
});

module.exports = router;