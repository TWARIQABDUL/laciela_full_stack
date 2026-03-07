// backend/routes/totals.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // your database connection
const authenticateUser = require("../middleware/auth");

// GET /api/total-money
router.get("/total-money", authenticateUser, async (req, res) => {
  try {
    const dbPromise = db.promise();
    const userRole = req.user.role;
    const userBranchId = req.user.branchId;

    let branchFilter = "";
    let params = [];

    if (userRole !== "SUPER_ADMIN") {
      branchFilter = " WHERE branch_id = ?";
      params = [userBranchId];
    }

    // Drinks total
    const [drinksResult] = await dbPromise.query(
      `SELECT SUM(sold * price) AS total FROM bar_products${branchFilter}`, params
    );
    const drinks = drinksResult[0].total || 0;

    // Kitchen total
    const [kitchenResult] = await dbPromise.query(
      `SELECT SUM(sold * price) AS total FROM kitchen_products${branchFilter}`, params
    );
    const kitchen = kitchenResult[0].total || 0;

    // Billiard total
    const [billiardResult] = await dbPromise.query(
      `SELECT SUM(cash + cash_momo + token) AS total FROM billiard${branchFilter}`, params
    );
    const billiard = billiardResult[0].total || 0;

    // Gym total
    const [gymResult] = await dbPromise.query(
      `SELECT SUM(cash + cash_momo) AS total FROM gym${branchFilter}`, params
    );
    const gym = gymResult[0].total || 0;

    // Guesthouse total
    const [guesthouseResult] = await dbPromise.query(
      `SELECT SUM((vip * vip_price) + (normal * normal_price)) AS total FROM guesthouse${branchFilter}`, params
    );
    const guesthouse = guesthouseResult[0].total || 0;

    // Expenses total
    const [expensesResult] = await dbPromise.query(
      `SELECT SUM(amount) AS total FROM expenses${branchFilter}`, params
    );
    const expenses = expensesResult[0].total || 0;

    // Send JSON response
    res.json({
      drinks,
      kitchen,
      billiard,
      gym,
      guesthouse,
      expenses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch totals" });
  }
});

module.exports = router;
