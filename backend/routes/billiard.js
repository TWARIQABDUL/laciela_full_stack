const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// ================= GET ALL RECORDS =================
router.get("/", authenticateUser, (req, res) => {
  const { date } = req.query;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = "SELECT * FROM billiard WHERE 1=1";
  const params = [];

  if (date) {
    sql += " AND date = ?";
    params.push(date);
  }
  
  if (userRole !== "SUPER_ADMIN") {
    sql += " AND branch_id = ?";
    params.push(userBranchId);
  }

  sql += " ORDER BY id DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json(err);

    // Calculate total dynamically
    const dataWithTotal = rows.map((r) => ({
      ...r,
      total: Number(r.token || 0) + Number(r.cash || 0) + Number(r.cash_momo || 0)
    }));

    res.json(dataWithTotal);
  });
});

// ================= ADD RECORD =================
router.post("/", authenticateUser, (req, res) => {
  const { date, token, cash, cash_momo } = req.body;
  const userBranchId = req.user.branchId;

  if (!date) return res.status(400).json({ message: "Date is required" });

  const sql = "INSERT INTO billiard (date, token, cash, cash_momo, branch_id) VALUES (?, ?, ?, ?, ?)";

  db.query(
    sql,
    [date, Number(token || 0), Number(cash || 0), Number(cash_momo || 0), userBranchId],
    (err, result) => {
      if (err) return res.status(500).json(err);

      db.query("SELECT * FROM billiard WHERE id = ?", [result.insertId], (err2, rows) => {
        if (err2) return res.status(500).json(err2);

        const row = rows[0];
        row.total = Number(row.token || 0) + Number(row.cash || 0) + Number(row.cash_momo || 0);
        res.json(row);
      });
    }
  );
});

// ================= UPDATE RECORD =================
router.put("/:id", authenticateUser, (req, res) => {
  const { token, cash, cash_momo } = req.body;
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (userRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Edit access restricted to Super Admin. Please submit a Change Request." });
  }

  let sql = "UPDATE billiard SET token=?, cash=?, cash_momo=? WHERE id=?";
  let params = [Number(token || 0), Number(cash || 0), Number(cash_momo || 0), id];

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json(err);

    db.query("SELECT * FROM billiard WHERE id = ?", [id], (err2, rows) => {
      if (err2) return res.status(500).json(err2);

      const row = rows[0];
      if (row) {
        row.total = Number(row.token || 0) + Number(row.cash || 0) + Number(row.cash_momo || 0);
        res.json(row);
      } else {
         res.status(404).json({ message: "Record not found (or insufficient permissions)" });
      }
    });
  });
});

// ================= DELETE RECORD =================
router.delete("/:id", authenticateUser, (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = "DELETE FROM billiard WHERE id=?";
  let params = [id];

  if (userRole !== "SUPER_ADMIN") {
    sql += " AND branch_id = ?";
    params.push(userBranchId);
  }

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Billiard record deleted successfully" });
  });
});

module.exports = router;