const { readData, writeData, generateId } = require("../config/fileDB");

class Payroll {
  static async findOne(query) {
    const payrolls = await readData("payrolls.json");
    
    if (!query) return null;
    
    return payrolls.find(payroll => {
      if (query._id || query.id) {
        const id = query._id || query.id;
        return payroll._id === id || payroll.id === id;
      }
      if (query.userId) {
        return payroll.userId === query.userId;
      }
      return false;
    }) || null;
  }

  static async find(query = {}) {
    let payrolls = await readData("payrolls.json");
    
    if (query.userId) {
      payrolls = payrolls.filter(payroll => payroll.userId === query.userId);
    }
    
    return payrolls;
  }

  static async create(data) {
    const payrolls = await readData("payrolls.json");
    
    const newPayroll = {
      _id: generateId(),
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    payrolls.push(newPayroll);
    await writeData("payrolls.json", payrolls);
    
    return newPayroll;
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const payrolls = await readData("payrolls.json");
    let index = -1;
    
    if (query.userId) {
      index = payrolls.findIndex(payroll => payroll.userId === query.userId);
    } else if (query._id || query.id) {
      const id = query._id || query.id;
      index = payrolls.findIndex(payroll => payroll._id === id || payroll.id === id);
    }
    
    if (index === -1) {
      if (options.upsert) {
        return await this.create(update.$set || update);
      }
      return null;
    }
    
    if (update.$set) {
      payrolls[index] = { ...payrolls[index], ...update.$set, updatedAt: new Date().toISOString() };
    } else {
      payrolls[index] = { ...payrolls[index], ...update, updatedAt: new Date().toISOString() };
    }
    
    await writeData("payrolls.json", payrolls);
    
    return options.new ? payrolls[index] : payrolls[index];
  }
}

module.exports = Payroll;

