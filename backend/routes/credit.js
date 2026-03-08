const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// ==========================================
// GET ALL EMPLOYEES (from users table)
// ==========================================
router.get("/", authenticateUser, (req, res) => {
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = `
    SELECT userId as id, username as name, role, payment, branch_id 
    FROM users 
    ORDER BY created_at DESC
  `;
  let params = [];

  // If not SUPER_ADMIN, strictly filter by branch_id
  if (userRole !== "SUPER_ADMIN") {
    sql = `
      SELECT userId as id, username as name, role, payment, branch_id 
      FROM users 
      WHERE branch_id = ?
      ORDER BY created_at DESC
    `;
    params = [userBranchId];
  }

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch employees" });
    res.json({ employees: rows });
  });
});

// ==========================================
// ADD NEW EMPLOYEE (into users table)
// ==========================================
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

  // Add into users table. Password is a required field, so we just set a default which they can't use to login anyway due to role block.
  const sql = "INSERT INTO users (username, password, role, branch_id, status, payment) VALUES (?, ?, 'EMPLOYEE', ?, 'active', ?)";
  
  db.query(sql, [name.trim(), 'employee_no_login_pw', userBranchId, Number(payment)], (err, result) => {
    if (err) {
      console.error("INSERT EMPLOYEE ERROR:", err);
      // Handle Unique Constraint on username
      if (err.code === 'ER_DUP_ENTRY') {
         return res.status(400).json({ error: "An employee or user with this name already exists." });
      }
      return res.status(500).json({ error: "Failed to add employee" });
    }

    // Return the newly inserted employee formatted like GET
    db.query("SELECT userId as id, username as name, payment, branch_id FROM users WHERE userId=?", [result.insertId], (err2, rows) => {
      if (err2) return res.status(500).json({ error: "Failed to fetch new employee" });
      res.json(rows[0]);
    });
  });
});

// ==========================================
// GET LOANS FOR AN EMPLOYEE
// ==========================================
router.get("/:id/loans", authenticateUser, (req, res) => {
  const { id } = req.params;
  
  db.query("SELECT * FROM employee_loans WHERE employee_id = ? ORDER BY loan_date DESC", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch loans" });
    res.json(rows);
  });
});

// ==========================================
// ADD NEW LOAN FOR AN EMPLOYEE
// ==========================================
router.post("/:id/loans", authenticateUser, (req, res) => {
  const { id } = req.params;
  const { amount, reason, loan_date } = req.body;
  const userBranchId = req.user.branchId;

  if (!amount || isNaN(Number(amount))) return res.status(400).json({ error: "Amount must be a valid number" });
  if (!loan_date) return res.status(400).json({ error: "Date is required" });

  const sql = "INSERT INTO employee_loans (employee_id, amount, reason, loan_date, remaining, branch_id) VALUES (?, ?, ?, ?, ?, ?)";
  // initially remaining = amount (since they borrow it, they have to pay back, so remaining to pay back is amount)
  db.query(sql, [id, Number(amount), reason || '', loan_date, Number(amount), userBranchId], (err, result) => {
    if (err) {
      console.error("INSERT LOAN ERROR:", err);
      return res.status(500).json({ error: "Failed to add loan" });
    }

    db.query("SELECT * FROM employee_loans WHERE id=?", [result.insertId], (err2, rows) => {
      if (err2) return res.status(500).json({ error: "Failed to fetch new loan" });
      res.json(rows[0]);
    });
  });
});

// ==========================================
// GET DEDUCTIONS FOR AN EMPLOYEE
// ==========================================
router.get("/:id/deductions", authenticateUser, (req, res) => {
  const { id } = req.params;
  
  db.query("SELECT * FROM credits WHERE user_id = ? ORDER BY date DESC", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch deductions" });
    res.json(rows);
  });
});

module.exports = router;