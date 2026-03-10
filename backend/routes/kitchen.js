const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// ==================================================
// GET ALL PRODUCTS BY DATE (With Auto-Carry Logic)
// ==================================================
router.get("/", authenticateUser, (req, res) => {
  const { date } = req.query;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (!date) return res.status(400).json({ message: "Date is required" });

  let branchFilter = "";
  let params = [date];
  if (userRole !== "SUPER_ADMIN") {
    branchFilter = " AND branch_id = ?";
    params.push(userBranchId);
  }

  // 1️⃣ Check existing
  db.query(`SELECT * FROM kitchen_products WHERE date = ?${branchFilter} ORDER BY id DESC`, params, (err, rows) => {
    if (err) return res.status(500).json(err);

    if (rows.length > 0) {
      const foods = rows.map((item) => {
        const cost = Number(item.initial_price) || 0;
        const price = Number(item.price) || 0;
        const opening_stock = Number(item.opening_stock) || 0;
        const entree = Number(item.entree) || 0;
        const sold = Number(item.sold) || 0;

        const total_stock = opening_stock + entree;
        const total_sold = sold * price;
        const profit = sold * (price - cost);
        const closing_stock = Math.max(total_stock - sold, 0);

        return { ...item, total_stock, total_sold, profit, closing_stock };
      });

      const totalEarned = foods.reduce((sum, f) => sum + f.total_sold, 0);
      const totalProfit = foods.reduce((sum, f) => sum + f.profit, 0);
      const totalStockValue = foods.reduce((sum, f) => sum + f.closing_stock * (Number(f.initial_price) || 0), 0);
      const lowStockCount = foods.filter((f) => f.closing_stock < 5).length;

      return res.json({ foods, totalEarned, totalProfit, totalStockValue, lowStockCount });
    }

    // 2️⃣ Auto-create from LATEST previous date
    let lastParams = [date];
    let lastFilter = "WHERE date < ?";
    if (userRole !== "SUPER_ADMIN") {
      lastFilter += " AND branch_id = ?";
      lastParams.push(userBranchId);
    }

    db.query(
      `SELECT * FROM kitchen_products ${lastFilter} AND date = (SELECT MAX(date) FROM kitchen_products ${lastFilter})`,
      [...lastParams, ...lastParams],
      (err2, prevRows) => {
        if (err2) return res.status(500).json(err2);

        if (prevRows.length === 0) {
          return res.json({ foods: [], totalEarned: 0, totalProfit: 0, totalStockValue: 0, lowStockCount: 0 });
        }

        const insertValues = prevRows.map((p) => {
          const closing_stock = (Number(p.opening_stock) || 0) + (Number(p.entree) || 0) - (Number(p.sold) || 0);
          return [
            p.name, Number(p.initial_price) || 0, Number(p.price) || 0,
            closing_stock > 0 ? closing_stock : 0, 0, 0, date, p.branch_id
          ];
        });

        db.query(
          `INSERT INTO kitchen_products (name, initial_price, price, opening_stock, entree, sold, date, branch_id) VALUES ?`,
          [insertValues],
          (err3) => {
            if (err3) return res.status(500).json(err3);
            
            // Re-fetch now that it's created
            db.query(`SELECT * FROM kitchen_products WHERE date = ?${branchFilter} ORDER BY id DESC`, params, (err4, newRows) => {
              if (err4) return res.status(500).json(err4);
              
              const foods = newRows.map((item) => {
                const cost = Number(item.initial_price) || 0;
                const price = Number(item.price) || 0;
                const opening_stock = Number(item.opening_stock) || 0;
                const entree = Number(item.entree) || 0;
                const sold = Number(item.sold) || 0;

                const total_stock = opening_stock + entree;
                const total_sold = sold * price;
                const profit = sold * (price - cost);
                const closing_stock = Math.max(total_stock - sold, 0);

                return { ...item, total_stock, total_sold, profit, closing_stock };
              });
              res.json({ foods, totalEarned: 0, totalProfit: 0, totalStockValue: 0, lowStockCount: 0 });
            });
          }
        );
      }
    );
  });
});

// ==================================================
// ADD/EDIT FOOD
// ==================================================
router.post("/", authenticateUser, (req, res) => {
  const { name, initial_price, price, opening_stock, entree, sold, date, id } = req.body;
  const userBranchId = req.user.branchId;

  if (!name || !date) return res.status(400).json({ message: "Name and date are required" });

  if (id) {
    if (req.user.role !== "SUPER_ADMIN") return res.status(403).json({ message: "Super Admin only." });
    const sql = `UPDATE kitchen_products SET name=?, initial_price=?, price=?, opening_stock=?, entree=?, sold=? WHERE id=? AND date=?`;
    db.query(sql, [name, Number(initial_price), Number(price), Number(opening_stock), Number(entree), Number(sold), id, date], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Food updated successfully" });
    });
  } else {
    const sql = `INSERT INTO kitchen_products (name, initial_price, price, opening_stock, entree, sold, date, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [name, Number(initial_price), Number(price), Number(opening_stock), Number(entree), Number(sold), date, userBranchId], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Food added successfully", id: result.insertId });
    });
  }
});

// ==================================================
// UPDATE ENTREE
// ==================================================
router.put("/entree/:id", authenticateUser, (req, res) => {
  const { entree, date } = req.body;
  const { id } = req.params;
  if (req.user.role !== "SUPER_ADMIN") return res.status(403).json({ message: "Super Admin only." });

  db.query(`UPDATE kitchen_products SET entree = ? WHERE id = ? AND date = ?`, [Number(entree), id, date], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Entree updated successfully" });
  });
});

// ==================================================
// UPDATE SOLD
// ==================================================
router.put("/sold/:id", authenticateUser, (req, res) => {
  const { sold, date } = req.body;
  const { id } = req.params;
  if (req.user.role !== "SUPER_ADMIN") return res.status(403).json({ message: "Super Admin only." });

  db.query(`UPDATE kitchen_products SET sold = ? WHERE id = ? AND date = ?`, [Number(sold), id, date], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Sold updated successfully" });
  });
});

// ==================================================
// DELETE FOOD
// ==================================================
router.delete("/:id", authenticateUser, (req, res) => {
  const { id } = req.params;
  if (req.user.role !== "SUPER_ADMIN") return res.status(403).json({ message: "Super Admin only." });

  db.query("DELETE FROM kitchen_products WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Item deleted successfully" });
  });
});

module.exports = router;