const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateUser = require("../middleware/auth");

// Helper to wrap db.query in a promise
const queryAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
};

// ==========================================
// GET /api/reports/branches
// ==========================================
router.get("/branches", authenticateUser, async (req, res) => {
  try {
    const branches = await queryAsync("SELECT id as branch_id, branchName as name FROM branch ORDER BY branchName");
    res.json({ branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

// ==========================================
// GET /api/reports/performance
// Query Params: ?branch_id=ALL or ?branch_id=branch-001
// ==========================================
router.get("/performance", authenticateUser, async (req, res) => {
  try {
    const userRole = req.user.role;
    let targetBranchId = req.query.branch_id || "ALL";

    // Enforce role restrictions
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    // Admins can only see their own branch performance
    if (userRole === "ADMIN") {
      targetBranchId = req.user.branchId;
    }

    let branchFilter = "";
    let params = [];

    if (targetBranchId !== "ALL") {
      branchFilter = " WHERE branch_id = ?";
      params = [targetBranchId];
    }

    // ===============================
    // 1. TOTAL INCOME (Matches totals.js but broken down)
    // ===============================
    const incomeData = { total: 0, byDept: {} };
    
    const [drinksResult] = await queryAsync(`SELECT SUM(sold * price) AS total FROM bar_products${branchFilter}`, params);
    const drinks = Number(drinksResult.total || 0);
    incomeData.byDept["bar_products"] = drinks;
    incomeData.total += drinks;

    const [kitchenResult] = await queryAsync(`SELECT SUM(sold * price) AS total FROM kitchen_products${branchFilter}`, params);
    const kitchen = Number(kitchenResult.total || 0);
    incomeData.byDept["kitchen_products"] = kitchen;
    incomeData.total += kitchen;

    const [billiardResult] = await queryAsync(`SELECT SUM(cash + cash_momo + token) AS total FROM billiard${branchFilter}`, params);
    const billiard = Number(billiardResult.total || 0);
    incomeData.byDept["billiard"] = billiard;
    incomeData.total += billiard;

    const [gymResult] = await queryAsync(`SELECT SUM(cash + cash_momo) AS total FROM gym${branchFilter}`, params);
    const gym = Number(gymResult.total || 0);
    incomeData.byDept["gym"] = gym;
    incomeData.total += gym;

    const [guesthouseResult] = await queryAsync(`SELECT SUM((vip * vip_price) + (normal * normal_price)) AS total FROM guesthouse${branchFilter}`, params);
    const guesthouse = Number(guesthouseResult.total || 0);
    incomeData.byDept["guesthouse"] = guesthouse;
    incomeData.total += guesthouse;


    // ===============================
    // 2. BUSINESS LOSS (Approved Requests where old_sold > new_sold)
    // ===============================
    // We group by "module" (which maps roughly to department)
    let lossSql = `
      SELECT module, SUM((old_sold - new_sold) * price) as loss_amount
      FROM edit_requests
      WHERE status = 'APPROVED' AND old_sold > new_sold
    `;
    let lossParams = [];

    if (targetBranchId !== "ALL") {
      lossSql += " AND branch_id = ?";
      lossParams.push(targetBranchId);
    }
    
    lossSql += " GROUP BY module";
    
    const lossResults = await queryAsync(lossSql, lossParams);
    
    const businessLoss = { total: 0, byDept: {} };
    lossResults.forEach(row => {
      const amt = Number(row.loss_amount || 0);
      businessLoss.byDept[row.module] = amt;
      businessLoss.total += amt;
    });


    // ===============================
    // 3. RECOVERED LOSS (Deductions from staff in 'credits' ledger)
    // ===============================
    // The credits table tracks deductor penalties. We JOIN with users to determine their generic role.
    let recSql = `
      SELECT u.role as staff_role, SUM(c.amount) as recovered_amount
      FROM credits c
      JOIN users u ON c.user_id = u.userId
    `;
    let recParams = [];

    if (targetBranchId !== "ALL") {
      recSql += " WHERE c.branch_id = ?";
      recParams.push(targetBranchId);
    }

    recSql += " GROUP BY u.role";

    const recoveredResults = await queryAsync(recSql, recParams);
    
    const recoveredLoss = { total: 0, byDept: {} };
    recoveredResults.forEach(row => {
      const amt = Number(row.recovered_amount || 0);
      
      // Map user role to generic department to align with income/loss
      let mappedDept = "Other";
      if (row.staff_role === "BAR_MAN" || row.staff_role === "TOKEN_MAN") mappedDept = "bar_products";
      else if (row.staff_role === "CHIEF_KITCHEN") mappedDept = "kitchen_products";
      else if (row.staff_role === "GYM") mappedDept = "gym";
      else if (row.staff_role === "LAND_LORD") mappedDept = "guesthouse";
      else if (row.staff_role === "MANAGER") mappedDept = "management";

      if (!recoveredLoss.byDept[mappedDept]) recoveredLoss.byDept[mappedDept] = 0;
      recoveredLoss.byDept[mappedDept] += amt;
      recoveredLoss.total += amt;
    });


    // ===============================
    // Combine Results
    // ===============================
    
    // Create a unified department list
    const allDepts = new Set([
      ...Object.keys(incomeData.byDept), 
      ...Object.keys(businessLoss.byDept), 
      ...Object.keys(recoveredLoss.byDept)
    ]);

    const departmentBreakdown = Array.from(allDepts).map(dept => {
      return {
        department: dept,
        income: incomeData.byDept[dept] || 0,
        business_loss: businessLoss.byDept[dept] || 0,
        recovered_loss: recoveredLoss.byDept[dept] || 0
      };
    });

    res.json({
      summary: {
        total_income: incomeData.total,
        business_loss: businessLoss.total,
        recovered_loss: recoveredLoss.total
      },
      departments: departmentBreakdown
    });

  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

module.exports = router;
