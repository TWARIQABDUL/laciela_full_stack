const fs = require("fs");
const mysql = require("mysql2");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL Error:", err.message);
  } else {
    console.log("✅ MySQL Connected to Aiven Cloud!");
    connection.release();
  }
});

module.exports = db;


