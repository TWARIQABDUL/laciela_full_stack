// backend/routes/totals.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // your database connection

// GET /api/total-money
router.get("/total-money", async (req, res) => {
  try {
    const dbPromise = db.promise();
    // Drinks total
    const [drinksResult] = await dbPromise.query(
      "SELECT SUM(quantity * price) AS total FROM drinks_sales"
    );
    const drinks = drinksResult[0].total || 0;

    // Kitchen total
    const [kitchenResult] = await dbPromise.query(
      "SELECT SUM(quantity * price) AS total FROM kitchen_sales"
    );
    const kitchen = kitchenResult[0].total || 0;

    // Billiard total
    const [billiardResult] = await dbPromise.query(
      "SELECT SUM(amount_paid) AS total FROM billiard_sales"
    );
    const billiard = billiardResult[0].total || 0;

    // Gym total
    const [gymResult] = await dbPromise.query(
      "SELECT SUM(amount_paid) AS total FROM gym_payments"
    );
    const gym = gymResult[0].total || 0;

    // Guesthouse total
    const [guesthouseResult] = await dbPromise.query(
      "SELECT SUM(amount_paid) AS total FROM guesthouse_payments"
    );
    const guesthouse = guesthouseResult[0].total || 0;

    // Expenses total
    const [expensesResult] = await dbPromise.query(
      "SELECT SUM(amount) AS total FROM expenses"
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
