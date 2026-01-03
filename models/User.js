const { readData, writeData, generateId } = require("../config/fileDB");

class User {
  static async findOne(query) {
    const users = await readData("users.json");
    
    if (!query) return null;
    
    return users.find(user => {
      if (query._id || query.id) {
        const id = query._id || query.id;
        return user._id === id || user.id === id;
      }
      if (query.email) {
        return user.email === query.email;
      }
      if (query.employeeId) {
        return user.employeeId === query.employeeId;
      }
      if (query.$or) {
        return query.$or.some(condition => {
          if (condition.email) return user.email === condition.email;
          if (condition.employeeId) return user.employeeId === condition.employeeId;
          return false;
        });
      }
      return false;
    }) || null;
  }

  static async find(query = {}) {
    const users = await readData("users.json");
    
    if (!query || Object.keys(query).length === 0) {
      return users;
    }
    
    return users.filter(user => {
      if (query.role) return user.role === query.role;
      return true;
    });
  }

  static async findById(id) {
    const users = await readData("users.json");
    return users.find(user => user._id === id || user.id === id) || null;
  }

  static async create(data) {
    const users = await readData("users.json");
    
    const newUser = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await writeData("users.json", users);
    
    return newUser;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    const users = await readData("users.json");
    const index = users.findIndex(user => user._id === id || user.id === id);
    
    if (index === -1) return null;
    
    if (update.$set) {
      users[index] = { ...users[index], ...update.$set, updatedAt: new Date().toISOString() };
    } else {
      users[index] = { ...users[index], ...update, updatedAt: new Date().toISOString() };
    }
    
    await writeData("users.json", users);
    
    return options.new ? users[index] : users[index];
  }

  static async findByIdAndDelete(id) {
    const users = await readData("users.json");
    const index = users.findIndex(user => user._id === id || user.id === id);
    
    if (index === -1) return null;
    
    const deleted = users.splice(index, 1)[0];
    await writeData("users.json", users);
    
    return deleted;
  }
}

module.exports = User;

