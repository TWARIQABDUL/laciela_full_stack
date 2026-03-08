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
// AUTO CREATE NEXT DAY FROM YESTERDAY CLOSING
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
  if (userRole !== "SUPER_ADMIN") {
    branchFilter = " AND branch_id = ?";
    params.push(userBranchId);
  }

  // 1️⃣ Check if date already exists
  db.query(
    `SELECT * FROM bar_products WHERE date = ?${branchFilter} ORDER BY id DESC`,
    params,
    (err, rows) => {
      if (err) return res.status(500).json(err);

      if (rows.length > 0) {
        return processAndReturn(rows, res);
      }

      // 2️⃣ Get yesterday
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yDate = yesterday.toISOString().split("T")[0];

      let yParams = [yDate];
      if (userRole !== "SUPER_ADMIN") {
        yParams.push(userBranchId);
      }

      db.query(
        `SELECT * FROM bar_products WHERE date = ?${branchFilter}`,
        yParams,
        (err2, yesterdayRows) => {
          if (err2) return res.status(500).json(err2);

          if (yesterdayRows.length === 0) {
            return res.json({ products: [], totalEarned: 0 });
          }

          // 3️⃣ Create new day from yesterday closing
          const insertValues = yesterdayRows.map((p) => {
            const closing_stock =
              (Number(p.opening_stock) || 0) +
              (Number(p.entree) || 0) -
              (Number(p.sold) || 0);

            return [
              p.name,
              Number(p.initial_price) || 0,
              Number(p.price) || 0,
              closing_stock > 0 ? closing_stock : 0,
              0,
              0,
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
  const { name, initial_price, price, opening_stock, date } = req.body;
  const userBranchId = req.user.branchId;

  if (!name || !date) {
    return res.status(400).json({ message: "Name and date required" });
  }

  db.query(
    `INSERT INTO bar_products
     (name, initial_price, price, opening_stock, entree, sold, date, branch_id)
     VALUES (?, ?, ?, ?, 0, 0, ?, ?)`,
    [
      name,
      Number(initial_price) || 0,
      Number(price) || 0,
      Number(opening_stock) || 0,
      date,
      userBranchId
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Product added successfully",
        id: result.insertId,
      });
    }
  );
});

// =====================================================
// UPDATE STOCK (ENTREE + SOLD)
// =====================================================
router.put("/stock/:id", authenticateUser, (req, res) => {
  const { entree, sold, date } = req.body;
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (userRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Edit access restricted to Super Admin. Please submit a Change Request." });
  }

  if (!date) {
    return res.status(400).json({ message: "Date required" });
  }

  let sql = `UPDATE bar_products SET entree = ?, sold = ? WHERE id = ? AND date = ?`;
  let params = [Number(entree) || 0, Number(sold) || 0, id, date];

  db.query(sql, params, (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Stock updated successfully" });
    }
  );
});

// =====================================================
// UPDATE PRICE ONLY
// =====================================================
router.put("/price/:id", authenticateUser, (req, res) => {
  const { initial_price, price, date } = req.body;
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (userRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Edit access restricted to Super Admin. Please submit a Change Request." });
  }

  if (!date) {
    return res.status(400).json({ message: "Date required" });
  }

  let sql = `UPDATE bar_products SET initial_price = ?, price = ? WHERE id = ? AND date = ?`;
  let params = [Number(initial_price) || 0, Number(price) || 0, id, date];

  db.query(sql, params, (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Price updated successfully" });
    }
  );
});

// =====================================================
// EDIT PRODUCT (NAME + COST + SELLING + OPENING STOCK)
// =====================================================
router.put("/edit/:id", authenticateUser, (req, res) => {
  const { name, initial_price, price, opening_stock, date } = req.body;
  const { id } = req.params;
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (userRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Edit access restricted to Super Admin. Please submit a Change Request." });
  }

  if (!name || !date) {
    return res.status(400).json({ message: "Name and date required" });
  }

  let sql = `UPDATE bar_products SET name = ?, initial_price = ?, price = ?, opening_stock = ? WHERE id = ? AND date = ?`;
  let params = [name, Number(initial_price) || 0, Number(price) || 0, Number(opening_stock) || 0, id, date];

  db.query(sql, params, (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Product updated successfully" });
    }
  );
});

module.exports = router;