const { readData, writeData, generateId } = require("../config/fileDB");

class Leave {
  static async findOne(query) {
    const leaves = await readData("leaves.json");
    
    if (!query) return null;
    
    return leaves.find(leave => {
      if (query._id || query.id) {
        const id = query._id || query.id;
        return leave._id === id || leave.id === id;
      }
      return false;
    }) || null;
  }

  static async find(query = {}) {
    let leaves = await readData("leaves.json");
    
    if (query.userId) {
      leaves = leaves.filter(leave => leave.userId === query.userId);
    }
    
    if (query.status) {
      leaves = leaves.filter(leave => leave.status === query.status);
    }
    
    // Sort by createdAt descending
    leaves.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    return leaves;
  }

  static async create(data) {
    const leaves = await readData("leaves.json");
    
    const newLeave = {
      _id: generateId(),
      ...data,
      from: data.from instanceof Date ? data.from.toISOString() : data.from,
      to: data.to instanceof Date ? data.to.toISOString() : data.to,
      status: data.status || "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    leaves.push(newLeave);
    await writeData("leaves.json", leaves);
    
    return newLeave;
  }

  static async findById(id) {
    const leaves = await readData("leaves.json");
    return leaves.find(leave => leave._id === id || leave.id === id) || null;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    const leaves = await readData("leaves.json");
    const index = leaves.findIndex(leave => leave._id === id || leave.id === id);
    
    if (index === -1) return null;
    
    if (update.$set) {
      leaves[index] = { ...leaves[index], ...update.$set, updatedAt: new Date().toISOString() };
    } else {
      leaves[index] = { ...leaves[index], ...update, updatedAt: new Date().toISOString() };
    }
    
    await writeData("leaves.json", leaves);
    
    return options.new ? leaves[index] : leaves[index];
  }
}

module.exports = Leave;

