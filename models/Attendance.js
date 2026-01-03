const { readData, writeData, generateId } = require("../config/fileDB");

class Attendance {
  static async findOne(query) {
    const attendances = await readData("attendance.json");
    
    if (!query) return null;
    
    return attendances.find(att => {
      if (query._id || query.id) {
        const id = query._id || query.id;
        return att._id === id || att.id === id;
      }
      if (query.userId && query.date) {
        const attDate = new Date(att.date);
        // Handle date range query
        if (query.date.$gte && query.date.$lt) {
          const start = new Date(query.date.$gte);
          const end = new Date(query.date.$lt);
          return att.userId === query.userId && attDate >= start && attDate < end;
        }
        // Handle single date
        const queryDate = new Date(query.date);
        return att.userId === query.userId && 
               attDate.toDateString() === queryDate.toDateString();
      }
      if (query.userId) {
        return att.userId === query.userId;
      }
      return false;
    }) || null;
  }

  static async find(query = {}) {
    let attendances = await readData("attendance.json");
    
    if (query.userId) {
      attendances = attendances.filter(att => att.userId === query.userId);
    }
    
    if (query.date) {
      if (query.date.$gte && query.date.$lte) {
        const start = new Date(query.date.$gte);
        const end = new Date(query.date.$lte);
        attendances = attendances.filter(att => {
          const attDate = new Date(att.date);
          return attDate >= start && attDate <= end;
        });
      }
    }
    
    return attendances;
  }

  static async create(data) {
    const attendances = await readData("attendance.json");
    
    const newAttendance = {
      _id: generateId(),
      ...data,
      date: data.date instanceof Date ? data.date.toISOString() : data.date,
      checkIn: data.checkIn instanceof Date ? data.checkIn.toISOString() : data.checkIn,
      checkOut: data.checkOut instanceof Date ? data.checkOut.toISOString() : data.checkOut,
      createdAt: new Date().toISOString()
    };
    
    attendances.push(newAttendance);
    await writeData("attendance.json", attendances);
    
    return newAttendance;
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const attendances = await readData("attendance.json");
    let index = -1;
    
    if (query._id || query.id) {
      const id = query._id || query.id;
      index = attendances.findIndex(att => att._id === id || att.id === id);
    } else if (query.userId && query.date) {
      // Handle date range query
      if (query.date.$gte && query.date.$lt) {
        const start = new Date(query.date.$gte);
        const end = new Date(query.date.$lt);
        index = attendances.findIndex(att => {
          const attDate = new Date(att.date);
          return att.userId === query.userId && attDate >= start && attDate < end;
        });
      } else {
        const queryDate = new Date(query.date.$gte || query.date);
        index = attendances.findIndex(att => {
          const attDate = new Date(att.date);
          return att.userId === query.userId && 
                 attDate.toDateString() === queryDate.toDateString();
        });
      }
    }
    
    if (index === -1) {
      if (options.upsert) {
        const newData = update.$set || update;
        return await this.create({ ...query, ...newData });
      }
      return null;
    }
    
    if (update.$set) {
      attendances[index] = { ...attendances[index], ...update.$set };
    } else {
      attendances[index] = { ...attendances[index], ...update };
    }
    
    await writeData("attendance.json", attendances);
    
    return options.new ? attendances[index] : attendances[index];
  }
}

module.exports = Attendance;

