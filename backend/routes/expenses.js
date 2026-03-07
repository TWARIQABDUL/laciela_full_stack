const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// ================= GET ALL EXPENSES =================
router.get("/", authenticateUser, (req, res) => {
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = "SELECT * FROM expenses";
  let params = [];

  if (userRole !== "SUPER_ADMIN") {
    sql += " WHERE branch_id = ?";
    params.push(userBranchId);
  }

  sql += " ORDER BY date DESC, id DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json(err);

    // Calculate totals for dashboard cards
    const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const totalCost = rows.reduce((sum, r) => sum + Number(r.cost || 0), 0);
    const totalProfit = rows.reduce(
      (sum, r) => sum + (Number(r.amount || 0) - Number(r.cost || 0)),
      0
    );

    const totalProfitable = rows.filter(r => r.is_profit === 1).length;
    const totalUnprofitable = rows.filter(r => r.is_profit === 0).length;

    res.json({
      records: rows,
      totalAmount,
      totalCost,
      totalProfit,
      totalProfitable,
      totalUnprofitable
    });
  });
});

// ================= ADD EXPENSE =================
router.post("/", authenticateUser, (req, res) => {
  const { expense_name, amount, cost, date, category, is_profit } = req.body;
  const userBranchId = req.user.branchId;

  if (!expense_name || !date || !category || is_profit === undefined) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const sql = `
    INSERT INTO expenses 
    (expense_name, amount, cost, date, category, is_profit, branch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      expense_name,
      Number(amount || 0),
      Number(cost || 0),
      date,
      category,
      Number(is_profit),
      userBranchId
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      // Return inserted row
      db.query(
        "SELECT * FROM expenses WHERE id = ?",
        [result.insertId],
        (err2, rows) => {
          if (err2) return res.status(500).json(err2);
          res.json(rows[0]);
        }
      );
    }
  );
});

// ================= UPDATE EXPENSE =================
router.put("/:id", authenticateUser, (req, res) => {
  const { expense_name, amount, cost, date, category, is_profit } = req.body;
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = `
    UPDATE expenses 
    SET expense_name=?, amount=?, cost=?, date=?, category=?, is_profit=?
    WHERE id=?
  `;
  let params = [
    expense_name,
    Number(amount || 0),
    Number(cost || 0),
    date,
    category,
    Number(is_profit),
    id
  ];

  if (userRole !== "SUPER_ADMIN") {
    sql += " AND branch_id = ?";
    params.push(userBranchId);
  }

  db.query(sql, params, (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Expense updated successfully" });
    }
  );
});

// ================= DELETE EXPENSE =================
router.delete("/:id", authenticateUser, (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = "DELETE FROM expenses WHERE id=?";
  let params = [id];

  if (userRole !== "SUPER_ADMIN") {
    sql += " AND branch_id = ?";
    params.push(userBranchId);
  }

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Expense deleted successfully" });
  });
});

module.exports = router;