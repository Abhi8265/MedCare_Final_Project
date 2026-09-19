const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:");
    console.error(err.message);
    return;
  }

  console.log("✅ MySQL Connected Successfully!");
});

module.exports = db;