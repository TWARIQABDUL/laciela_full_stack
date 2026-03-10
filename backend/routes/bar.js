const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// =====================================================
// HELPER FUNCTION – CALCULATE VALUES
// =====================================================
function processAndReturn(rows, res) {
  const products = rows.map((p) => {
    const opening_stock = Number(p.opening_stock) || 0;
    const entree = Number(p.entree) || 0;
    const sold = Number(p.sold) || 0;
    const price = Number(p.price) || 0;
    const initial_price = Number(p.initial_price) || 0;

    const total_stock = opening_stock + entree;
    const closing_stock = Math.max(total_stock - sold, 0);
    const total_sold = sold * price;
    const profit = sold * (price - initial_price);

    return {
      ...p,
      total_stock,
      closing_stock,
      total_sold,
      profit,
    };
  });

  const totalEarned = products.reduce(
    (sum, p) => sum + p.total_sold,
    0
  );

  res.json({ products, totalEarned });
}

// =====================================================
// GET PRODUCTS BY DATE
// =====================================================
router.get("/", authenticateUser, (req, res) => {
  const { date } = req.query;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  let branchFilter = "";
  let params = [date];
  let branchIdVal = null;
  if (userRole !== "SUPER_ADMIN") {
    branchFilter = " AND branch_id = ?";
    params.push(userBranchId);
    branchIdVal = userBranchId;
  }

  // 1️⃣ Check if date exists
  db.query(
    `SELECT * FROM bar_products WHERE date = ?${branchFilter} ORDER BY id DESC`,
    params,
    (err, rows) => {
      if (err) return res.status(500).json(err);

      if (rows.length > 0) {
        return processAndReturn(rows, res);
      }

      // 2️⃣ Find the LATEST previous entry (Not just date - 1)
      let latestParams = [date];
      let latestFilter = "WHERE date < ?";
      if (userRole !== "SUPER_ADMIN") {
        latestFilter += " AND branch_id = ?";
        latestParams.push(userBranchId);
      }

      db.query(
        `SELECT * FROM bar_products ${latestFilter} AND date = (SELECT MAX(date) FROM bar_products ${latestFilter})`,
        [...latestParams, ...latestParams],
        (err2, prevRows) => {
          if (err2) return res.status(500).json(err2);

          if (prevRows.length === 0) {
            return res.json({ products: [], totalEarned: 0 });
          }

          // 3️⃣ Auto-carry forward: Closing becomes Opening
          const insertValues = prevRows.map((p) => {
            const closing_stock =
              (Number(p.opening_stock) || 0) +
              (Number(p.entree) || 0) -
              (Number(p.sold) || 0);

            return [
              p.name,
              Number(p.initial_price) || 0,
              Number(p.price) || 0,
              closing_stock > 0 ? closing_stock : 0,
              0, // entree
              0, // sold
              date,
              p.branch_id
            ];
          });

          db.query(
            `INSERT INTO bar_products
             (name, initial_price, price, opening_stock, entree, sold, date, branch_id)
             VALUES ?`,
            [insertValues],
            (err3) => {
              if (err3) return res.status(500).json(err3);

              db.query(
                `SELECT * FROM bar_products WHERE date = ?${branchFilter} ORDER BY id DESC`,
                params,
                (err4, newRows) => {
                  if (err4) return res.status(500).json(err4);
                  processAndReturn(newRows, res);
                }
              );
            }
          );
        }
      );
    }
  );
});

// =====================================================
// ADD PRODUCT
// =====================================================
router.post("/", authenticateUser, (req, res) => {
  const { name, initial_price, price, opening_stock, entree, sold, date } = req.body;
  const userBranchId = req.user.branchId;

  if (!name || !date) {
    return res.status(400).json({ message: "Name and date required" });
  }

  db.query(
    `INSERT INTO bar_products
     (name, initial_price, price, opening_stock, entree, sold, date, branch_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      Number(initial_price) || 0,
      Number(price) || 0,
      Number(opening_stock) || 0,
      Number(entree) || 0,
      Number(sold) || 0,
      date,
      userBranchId
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Product added successfully", id: result.insertId });
    }
  );
});

// =====================================================
// UPDATE STOCK
// =====================================================
router.put("/stock/:id", authenticateUser, (req, res) => {
  const { entree, sold, date } = req.body;
  const { id } = req.params;
  const userRole = req.user.role;

  if (userRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Access restricted to Super Admin." });
  }

  db.query(
    `UPDATE bar_products SET entree = ?, sold = ? WHERE id = ? AND date = ?`,
    [Number(entree) || 0, Number(sold) || 0, id, date],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Stock updated successfully" });
    }
  );
});

// =====================================================
// EDIT PRODUCT
// =====================================================
router.put("/edit/:id", authenticateUser, (req, res) => {
  const { name, initial_price, price, opening_stock, date } = req.body;
  const { id } = req.params;
  const userRole = req.user.role;

  if (userRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Access restricted to Super Admin." });
  }

  db.query(
    `UPDATE bar_products SET name = ?, initial_price = ?, price = ?, opening_stock = ? WHERE id = ? AND date = ?`,
    [name, Number(initial_price) || 0, Number(price) || 0, Number(opening_stock) || 0, id, date],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Product updated successfully" });
    }
  );
});

// =====================================================
// DELETE PRODUCT
// =====================================================
router.delete("/:id", authenticateUser, (req, res) => {
  const { id } = req.params;
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Only Super Admin can delete items." });
  }
  db.query("DELETE FROM bar_products WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Product deleted successfully" });
  });
});

module.exports = router;