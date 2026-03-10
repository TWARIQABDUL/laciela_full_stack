const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// ==========================================
// GET ALL EMPLOYEES / USERS
// ==========================================
router.get("/", authenticateUser, (req, res) => {
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  let sql = `
    SELECT u.userId as id, u.username as name, u.role, u.payment, u.branch_id, b.branchName as branch_name
    FROM users u
    LEFT JOIN branch b ON u.branch_id = b.id
    ORDER BY u.created_at DESC
  `;
  let params = [];

  // If not SUPER_ADMIN, strictly filter by branch_id
  if (userRole !== "SUPER_ADMIN") {
    sql = `
      SELECT u.userId as id, u.username as name, u.role, u.payment, u.branch_id, b.branchName as branch_name
      FROM users u
      LEFT JOIN branch b ON u.branch_id = b.id
      WHERE u.branch_id = ?
      ORDER BY u.created_at DESC
    `;
    params = [userBranchId];
  }

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch employees" });
    res.json({ employees: rows });
  });
});

// ==========================================
// ADD NEW USER / STAFF
// ==========================================
router.post("/", authenticateUser, (req, res) => {
  const { username, password, role, branch_id, payment } = req.body;
  const currentUserRole = req.user.role;
  const currentUserBranchId = req.user.branchId;

  // Security: Managers cannot add staff natively.
  if (currentUserRole === "MANAGER") {
    return res.status(403).json({ error: "Managers cannot add staff." });
  }

  if (!username || !username.trim()) return res.status(400).json({ error: "Username is required" });
  
  // Basic validation
  const finalRole = role || 'EMPLOYEE';
  const finalBranchId = (currentUserRole === 'SUPER_ADMIN') ? (branch_id || null) : currentUserBranchId;
  const finalPassword = password || '123456'; // Default password if none provided
  const finalPayment = Number(payment) || 0;

  const sql = "INSERT INTO users (username, password, role, branch_id, status, payment) VALUES (?, ?, ?, ?, 'active', ?)";
  
  db.query(sql, [username.trim(), finalPassword, finalRole, finalBranchId, finalPayment], (err, result) => {
    if (err) {
      console.error("INSERT USER ERROR:", err);
      if (err.code === 'ER_DUP_ENTRY') {
         return res.status(400).json({ error: "A user with this name already exists." });
      }
      return res.status(500).json({ error: "Failed to add user" });
    }

    // Return the newly inserted user
    db.query(`
      SELECT u.userId as id, u.username as name, u.role, u.payment, u.branch_id, b.branchName as branch_name
      FROM users u
      LEFT JOIN branch b ON u.branch_id = b.id
      WHERE u.userId = ?
    `, [result.insertId], (err2, rows) => {
      if (err2) return res.status(500).json({ error: "Failed to fetch new user" });
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