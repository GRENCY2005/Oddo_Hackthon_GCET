const fs = require("fs").promises;
const path = require("path");

// Data directory
const DATA_DIR = path.join(__dirname, "..", "data");

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
};

// Initialize data files if they don't exist
const initDataFiles = async () => {
  await ensureDataDir();
  
  const files = [
    { name: "users.json", default: [] },
    { name: "attendance.json", default: [] },
    { name: "leaves.json", default: [] },
    { name: "payrolls.json", default: [] }
  ];

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file.name);
    try {
      await fs.access(filePath);
      // File exists, do nothing
    } catch {
      // File doesn't exist, create it with default data
      await fs.writeFile(filePath, JSON.stringify(file.default, null, 2));
      console.log(`  ✓ Created data file: ${file.name}`);
    }
  }
};

// Read data from file
const readData = async (filename) => {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    if (error.code === "ENOENT") {
      await fs.writeFile(filePath, JSON.stringify([], null, 2));
      return [];
    }
    throw error;
  }
};

// Write data to file
const writeData = async (filename, data) => {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

module.exports = {
  initDataFiles,
  readData,
  writeData,
  generateId,
  DATA_DIR
};

