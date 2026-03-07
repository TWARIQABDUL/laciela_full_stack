const db = require('./db');

async function seed() {
  const dbPromise = db.promise();
  
  try {
    console.log("Seeding started...");
    
    // Disable foreign key checks for clearing
    await dbPromise.query("SET FOREIGN_KEY_CHECKS = 0");

    const tables = [
      "users", "branch", "bar_products", "kitchen_products", 
      "billiard", "gym", "guesthouse", "expenses", 
      "credits", "employee_loans", "employees"
    ];

    for (const table of tables) {
      await dbPromise.query(`TRUNCATE TABLE ${table}`);
    }

    await dbPromise.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("✅ Previous data cleared...");

    // Insert branches
    const branch1Id = "branch-001";
    const branch2Id = "branch-002";
    
    await dbPromise.query("INSERT INTO branch (id, branchName, region) VALUES (?, ?, ?)", [branch1Id, "Kigali Main", "Kigali"]);
    await dbPromise.query("INSERT INTO branch (id, branchName, region) VALUES (?, ?, ?)", [branch2Id, "Gisenyi Resort", "Rubavu"]);
    console.log("✅ Branches inserted...");

    // Define all roles
    const roles = ['SUPER_ADMIN', 'BAR_MAN', 'MANAGER', 'CHIEF_KITCHEN', 'ADMIN', 'TOKEN_MAN', 'LAND_LORD', 'GYM'];

    // Insert users for branch 1
    const usersBranch1 = roles.map((role) => [
      `${role.toLowerCase().replace('_', '')}1`, // e.g., superadmin1
      role,
      'password123',
      'active',
      branch1Id
    ]);

    // Insert users for branch 2
    const usersBranch2 = roles.map((role) => [
      `${role.toLowerCase().replace('_', '')}2`, // e.g., superadmin2
      role,
      'password123',
      'active',
      branch2Id
    ]);

    await dbPromise.query("INSERT INTO users (username, role, password, status, branch_id) VALUES ?", [[...usersBranch1, ...usersBranch2]]);
    console.log("✅ Users inserted...");

    // Seed mock data for dashboard modules
    const today = new Date().toISOString().split("T")[0];

    // 1. Bar Products
    const barData = [
      ["Mutzig 50cl", 800, 1000, 100, 50, 45, today, branch1Id],
      ["Amstel 50cl", 700, 900, 80, 20, 30, today, branch1Id],
      ["Mutzig 50cl", 800, 1100, 50, 10, 25, today, branch2Id],
      ["Skol 50cl", 600, 800, 120, 0, 40, today, branch2Id]
    ];
    await dbPromise.query("INSERT INTO bar_products (name, initial_price, price, opening_stock, entree, sold, date, branch_id) VALUES ?", [barData]);

    // 2. Kitchen Products
    const kitchenData = [
      ["Brochette", 500, 1000, 0, 100, 90, today, branch1Id],
      ["Roasted Chicken", 3000, 5000, 0, 20, 15, today, branch1Id],
      ["Fish", 4000, 7000, 0, 30, 28, today, branch2Id]
    ];
    await dbPromise.query("INSERT INTO kitchen_products (name, initial_price, price, opening_stock, entree, sold, date, branch_id) VALUES ?", [kitchenData]);

    // 3. Billiard
    const billiardData = [
      [today, 10, 2000, 1000, branch1Id],
      [today, 15, 3000, 1500, branch2Id]
    ];
    await dbPromise.query("INSERT INTO billiard (date, token, cash, cash_momo, branch_id) VALUES ?", [billiardData]);

    // 4. Gym
    const gymData = [
      [today, 5, 2, 7, 5000, 2000, branch1Id],
      [today, 10, 5, 15, 10000, 5000, branch2Id]
    ];
    await dbPromise.query("INSERT INTO gym (date, daily_people, monthly_people, total_people, cash, cash_momo, branch_id) VALUES ?", [gymData]);

    // 5. Guesthouse
    const guesthouseData = [
      [today, 2, 5, 20000, 10000, "Available", branch1Id],
      [today, 4, 10, 25000, 12000, "Available", branch2Id]
    ];
    await dbPromise.query("INSERT INTO guesthouse (date, vip, normal, vip_price, normal_price, status, branch_id) VALUES ?", [guesthouseData]);

    // 6. Expenses
    const expensesData = [
      ["Cleaning Supplies", 5000, 5000, today, "bar", 0, branch1Id],
      ["Vegetables", 10000, 10000, today, "kitchen", 0, branch1Id],
      ["Electricity", 20000, 20000, today, "unprofitable", 0, branch2Id]
    ];
    await dbPromise.query("INSERT INTO expenses (expense_name, amount, cost, date, category, is_profit, branch_id) VALUES ?", [expensesData]);

    // 7. Credits (Staff)
    const creditsData = [
      ["Alice Manager", 150000, branch1Id],
      ["Bob Bartender", 80000, branch1Id],
      ["Charlie Chef", 120000, branch2Id],
      ["Diana Gym", 90000, branch2Id]
    ];
    await dbPromise.query("INSERT INTO credits (name, payment, branch_id) VALUES ?", [creditsData]);

    console.log("✅ Transaction tables seeded...");

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

seed();
