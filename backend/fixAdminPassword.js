const bcrypt = require("bcryptjs");
const db = require("./db");

(async () => {
  try {
    const hash = await bcrypt.hash("admin123", 10);

    db.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hash, "admin@gmail.com"],
      (err, result) => {
        if (err) {
          console.error("❌ Error:", err);
          process.exit(1);
        }

        console.log("✅ Admin password updated successfully!");
        console.log("Email: admin@gmail.com");
        console.log("Password: admin123");

        process.exit(0);
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
})();