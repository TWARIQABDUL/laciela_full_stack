const db = require('./db');

async function seed() {
  const dbPromise = db.promise();
  
  try {
    console.log("Seeding started...");

    // Insert branches
    const branch1Id = "branch-001";
    const branch2Id = "branch-002";
    
    // Clear existing data (optional, but good for a fresh seed)
    await dbPromise.query("DELETE FROM users");
    await dbPromise.query("DELETE FROM branch");

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

    const sql = "INSERT INTO users (username, role, password, status, branch_id) VALUES ?";
    
    await dbPromise.query(sql, [[...usersBranch1, ...usersBranch2]]);
    
    console.log("✅ Users inserted...");
    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

seed();
