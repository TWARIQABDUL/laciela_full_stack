const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// ================= GET BY DATE =================
router.get("/", authenticateUser, (req, res) => {
  const { date } = req.query;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  let sql = "SELECT * FROM guesthouse WHERE date = ?";
  let params = [date];

  if (userRole !== "SUPER_ADMIN") {
    sql += " AND branch_id = ?";
    params.push(userBranchId);
  }

  sql += " ORDER BY id DESC";

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({ rooms: rows });
  });
});

// ================= INSERT =================
router.post("/", authenticateUser, (req, res) => {
  const { date, vip, normal, vip_price, normal_price } = req.body;
  const userBranchId = req.user.branchId;

  if (!date) {
    return res.status(400).json({ message: "Ntamakuru ahari y' izi tariki" });
  }

  const sql = `
    INSERT INTO guesthouse 
    (date, vip, normal, vip_price, normal_price, branch_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      date,
      vip || 0,
      normal || 0,
      vip_price || 0,
      normal_price || 0,
      userBranchId
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json({
        message: "Guesthouse record added",
        id: result.insertId,
      });
    }
  );
});

// ================= UPDATE =================
router.put("/:id", authenticateUser, (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (userRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Edit access restricted to Super Admin. Please submit a Change Request." });
  }

  let sql = "UPDATE guesthouse SET ? WHERE id = ?";
  let params = [fields, id];

  db.query(sql, params, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({ message: "Updated successfully" });
  });
});

// ================= DELETE =================
router.delete("/:id", authenticateUser, (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = "DELETE FROM guesthouse WHERE id = ?";
  let params = [id];

  if (userRole !== "SUPER_ADMIN") {
    sql += " AND branch_id = ?";
    params.push(userBranchId);
  }

  db.query(sql, params, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({ message: "Deleted successfully" });
  });
});

module.exports = router;