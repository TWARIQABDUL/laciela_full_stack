const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// ==================================================
// POST: Submit a new Edit Request
// Stores requester_user_id from JWT — no username dependency
// ==================================================
router.post("/", authenticateUser, (req, res) => {
  const {
    module, record_id, record_date,
    product_name, old_sold, new_sold, price, reason
  } = req.body;

  const userId   = req.user.userId || req.user.id;   // from JWT
  const branchId = req.user.branchId;

  if (!userId) {
    return res.status(401).json({ message: "Could not resolve user ID from token. Please log out and log back in." });
  }

  if (!module || !record_id || !record_date || new_sold == null || !reason) {
    return res.status(400).json({ message: "Incomplete request parameters." });
  }

  const sql = `
    INSERT INTO edit_requests 
    (requester_user_id, branch_id, module, record_id, record_date, product_name, old_sold, new_sold, price, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [userId, branchId, module, record_id, record_date, product_name, old_sold || 0, new_sold, price || 0, reason],
    (err) => {
      if (err) {
        console.error("Error inserting edit request:", err);
        return res.status(500).json(err);
      }
      res.json({ message: "Change Request Submitted to Super Admin" });
    }
  );
});

// ==================================================
// GET: Unread Count (must come BEFORE GET /)
// ==================================================
router.get("/count", authenticateUser, (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") return res.json({ count: 0 });

  db.query("SELECT COUNT(*) as count FROM edit_requests WHERE status = 'PENDING'", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json({ count: rows[0].count });
  });
});

// ==================================================
// GET: Fetch Pending Requests (For SUPER_ADMIN)
// JOINs users table so the requester's name and role are returned
// ==================================================
router.get("/", authenticateUser, (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Unauthorized. Super Admins only." });
  }

  const sql = `
    SELECT 
      er.*,
      u.username  AS requester_username,
      u.role      AS requester_role
    FROM edit_requests er
    LEFT JOIN users u ON er.requester_user_id = u.userId
    WHERE er.status = 'PENDING'
    ORDER BY er.created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json({ requests: rows });
  });
});

// ==================================================
// PUT: Approve Request
// ==================================================
router.put("/:id/approve", authenticateUser, (req, res) => {
  const { id } = req.params;

  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  db.query("SELECT * FROM edit_requests WHERE id = ?", [id], (err, rows) => {
    if (err || rows.length === 0) return res.status(500).json({ message: "Request not found" });

    const request = rows[0];
    const updateSql = `UPDATE ${request.module} SET sold = ? WHERE id = ?`;

    db.query(updateSql, [request.new_sold, request.record_id], (err2) => {
      if (err2) return res.status(500).json(err2);

      db.query("UPDATE edit_requests SET status = 'APPROVED' WHERE id = ?", [id], (err3) => {
        if (err3) return res.status(500).json(err3);
        res.json({ message: "Request Approved and Stock Updated!" });
      });
    });
  });
});

// ==================================================
// PUT: Reject Request — deduct loss from credits via user_id FK
// ==================================================
router.put("/:id/reject", authenticateUser, (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;

  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  db.query("SELECT * FROM edit_requests WHERE id = ?", [id], (err, rows) => {
    if (err || rows.length === 0) return res.status(500).json({ message: "Request not found" });

    const request = rows[0];

    if (!request.requester_user_id) {
      return res.status(400).json({ message: "Cannot deduct — request has no linked user_id. Ask staff to re-submit after logging in again." });
    }

    const difference = request.old_sold - request.new_sold;
    const deduction  = difference > 0 ? difference * request.price : 0;

    // Mark REJECTED
    db.query("UPDATE edit_requests SET status = 'REJECTED' WHERE id = ?", [id], (err2) => {
      if (err2) return res.status(500).json(err2);

      if (deduction > 0) {
        // Deduct from users WHERE userId = requester_user_id (FK)
        db.query(
          "UPDATE users SET payment = payment - ? WHERE userId = ?",
          [deduction, request.requester_user_id],
          (err3, result) => {
            if (err3) return res.status(500).json(err3);
            
            // Log the deduction in the credits ledger
            const reasonLog = `Deduction for rejected edit request on ${request.module} (ID: ${request.record_id})`;
            db.query(
              "INSERT INTO credits (user_id, amount, reason, branch_id) VALUES (?, ?, ?, ?)",
              [request.requester_user_id, deduction, reasonLog, request.branch_id],
              (err4) => {
                if (err4) console.error("Error logging deduction to ledger:", err4);
                
                res.json({
                  message: `Rejected. Deducted ${deduction.toLocaleString()} RWF from user's salary.`,
                  rows_affected: result.affectedRows
                });
              }
            );
          }
        );
      } else {
        res.json({ message: "Rejected. No financial loss detected to deduct." });
      }
    });
  });
});

module.exports = router;
