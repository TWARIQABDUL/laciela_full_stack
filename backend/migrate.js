const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  const dbPromise = db.promise();
  const migrationsPath = path.join(__dirname, 'migrations');

  try {
    console.log("Starting migrations...");

    // 1. Create migrations tracking table if it doesn't exist
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Get already executed migrations
    const [executed] = await dbPromise.query("SELECT migration_name FROM _migrations");
    const executedMigrations = executed.map(row => row.migration_name);

    // 3. Read migration files from the migrations directory
    if (!fs.existsSync(migrationsPath)) {
      console.log("No migrations folder found.");
      process.exit(0);
    }

    const files = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to ensure consecutive execution

    let pendingMigrations = files.filter(file => !executedMigrations.includes(file));

    if (pendingMigrations.length === 0) {
      console.log("✅ Database is up to date. No pending migrations.");
      process.exit(0);
    }

    // 4. Run each pending migration
    for (const file of pendingMigrations) {
      console.log(`Executing migration: ${file}`);
      const filePath = path.join(migrationsPath, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute the SQL instructions
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        await dbPromise.query(statement);
      }

      // Record it as executed
      await dbPromise.query("INSERT INTO _migrations (migration_name) VALUES (?)", [file]);
      console.log(`✅ Success: ${file}`);
    }

    console.log("🎉 All migrations executed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

runMigrations();
