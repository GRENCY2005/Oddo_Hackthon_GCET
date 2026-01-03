const { initDataFiles } = require("./fileDB");

// File-based database initialization
const connectDB = async () => {
  try {
    console.log("📁 Initializing file-based database...");
    await initDataFiles();
    console.log("✓ File-based database ready!");
    console.log("  Data stored in: backend/data/");
    console.log("  Files: users.json, attendance.json, leaves.json, payrolls.json\n");
  } catch (error) {
    console.error("✗ File database initialization error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
