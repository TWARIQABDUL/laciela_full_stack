const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// ==================================================
// GET ALL PRODUCTS BY DATE
// ==================================================
router.get("/", authenticateUser, (req, res) => {
  const { date } = req.query;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  let sql = `SELECT * FROM kitchen_products WHERE date = ?`;
  let params = [date];
  
  if (userRole !== "SUPER_ADMIN") {
    sql += ` AND branch_id = ?`;
    params.push(userBranchId);
  }
  
  sql += ` ORDER BY id DESC`;

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json(err);
    }

    const foods = rows.map((item) => {
      const cost = Number(item.initial_price) || 0;
      const price = Number(item.price) || 0;
      const opening_stock = Number(item.opening_stock) || 0;
      const entree = Number(item.entree) || 0;
      const sold = Number(item.sold) || 0;

      const total_stock = opening_stock + entree;
      const total_sold = sold * price;
      const profit = sold * (price - cost);
      const closing_stock = total_stock - sold;

      return {
        ...item,
        total_stock,
        total_sold,
        profit,
        closing_stock,
      };
    });

    const totalEarned = foods.reduce((sum, f) => sum + f.total_sold, 0);
    const totalProfit = foods.reduce((sum, f) => sum + f.profit, 0);
    const totalStockValue = foods.reduce(
      (sum, f) => sum + f.closing_stock * (Number(f.initial_price) || 0),
      0
    );
    const lowStockCount = foods.filter((f) => f.closing_stock < 5).length;

    res.json({
      foods,
      totalEarned,
      totalProfit,
      totalStockValue,
      lowStockCount,
    });
  });
});

// ==================================================
// ADD NEW FOOD
// ==================================================
router.post("/", authenticateUser, (req, res) => {
  const { name, initial_price, price, opening_stock, date } = req.body;
  const userBranchId = req.user.branchId;

  if (!name || !date) {
    return res.status(400).json({
      message: "Name and date are required",
    });
  }

  const sql = `
    INSERT INTO kitchen_products
    (name, initial_price, price, opening_stock, entree, sold, date, branch_id)
    VALUES (?, ?, ?, ?, 0, 0, ?, ?)
  `;

  db.query(
    sql,
    [
      name,
      Number(initial_price) || 0,
      Number(price) || 0,
      Number(opening_stock) || 0,
      date,
      userBranchId
    ],
    (err, result) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).json(err);
      }

      res.json({
        message: "Food added successfully",
        id: result.insertId,
      });
    }
  );
});

// ==================================================
// UPDATE ENTREE
// ==================================================
router.put("/entree/:id", authenticateUser, (req, res) => {
  const { entree, date } = req.body;
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (userRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Edit access restricted to Super Admin. Please submit a Change Request." });
  }

  if (entree == null || !date) {
    return res.status(400).json({
      message: "Entree and date are required",
    });
  }

  let sql = `UPDATE kitchen_products SET entree = ? WHERE id = ? AND date = ?`;
  let params = [Number(entree), id, date];

  db.query(sql, params, (err) => {
    if (err) {
      console.error("Entree update error:", err);
      return res.status(500).json(err);
    }

    res.json({ message: "Entree updated successfully" });
  });
});

// ==================================================
// UPDATE SOLD
// ==================================================
router.put("/sold/:id", authenticateUser, (req, res) => {
  const { sold, date } = req.body;
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (userRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Edit access restricted to Super Admin. Please submit a Change Request." });
  }

  if (sold == null || !date) {
    return res.status(400).json({
      message: "Sold and date are required",
    });
  }

  let sql = `UPDATE kitchen_products SET sold = ? WHERE id = ? AND date = ?`;
  let params = [Number(sold), id, date];

  db.query(sql, params, (err) => {
    if (err) {
      console.error("Sold update error:", err);
      return res.status(500).json(err);
    }

    res.json({ message: "Sold updated successfully" });
  });
});

module.exports = router;