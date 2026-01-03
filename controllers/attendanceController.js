const Attendance = require("../models/Attendance");
const User = require("../models/User");

exports.markCheckIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const todayStart = new Date(today);
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    let attendance = await Attendance.findOne({
      userId,
      date: { $gte: todayStart, $lt: todayEnd }
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    if (attendance) {
      attendance = await Attendance.findOneAndUpdate(
        { _id: attendance._id },
        { $set: { checkIn: new Date(), status: "Present" } },
        { new: true }
      );
    } else {
      attendance = await Attendance.create({
        userId,
        date: today,
        checkIn: new Date(),
        status: "Present"
      });
    }

    res.json({ message: "Checked in successfully", attendance });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markCheckOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all attendances for this user and filter by date
    const todayStart = new Date(today);
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const allAttendances = await Attendance.find({ userId });
    const attendance = allAttendances.find(att => {
      const attDate = new Date(att.date);
      return attDate >= todayStart && attDate < todayEnd;
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Please check in first" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(attendance.checkIn);
    
    // Calculate hours worked
    const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    const roundedHours = Math.round(hoursWorked * 100) / 100;

    // Update status if half-day
    let status = attendance.status;
    if (roundedHours < 4) {
      status = "Half-day";
    }

    attendance = await Attendance.findOneAndUpdate(
      { _id: attendance._id },
      { 
        $set: { 
          checkOut: checkOutTime,
          hoursWorked: roundedHours,
          status: status
        } 
      },
      { new: true }
    );

    res.json({ message: "Checked out successfully", attendance });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = { userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 30 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate("userId", "name employeeId");

    res.json(attendance);
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { userId, startDate, endDate } = req.query;

    let query = {};

    if (userId) {
      query.userId = userId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 30 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      query.date = { $gte: start, $lte: end };
    }

    let attendance = await Attendance.find(query);
    
    // Sort by date descending
    attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Populate user data
    const users = await User.find();
    attendance = attendance.map(att => {
      const user = users.find(u => u._id === att.userId);
      return {
        ...att,
        userId: user ? { name: user.name, employeeId: user.employeeId, email: user.email } : att.userId
      };
    });

    res.json(attendance);
  } catch (error) {
    console.error("Get all attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { attendanceId } = req.params;
    const { status, date } = req.body;

    const attendance = await Attendance.findOne({ _id: attendanceId });
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const updates = {};
    if (status) updates.status = status;
    if (date) updates.date = new Date(date);

    const updated = await Attendance.findOneAndUpdate(
      { _id: attendanceId },
      { $set: updates },
      { new: true }
    );

    res.json({ message: "Attendance updated successfully", attendance });
  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.role === "HR" && req.query.userId ? req.query.userId : req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStart = new Date(today);
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Get all attendances for this user and filter by date
    const allAttendances = await Attendance.find({ userId });
    let attendance = allAttendances.find(att => {
      const attDate = new Date(att.date);
      return attDate >= todayStart && attDate < todayEnd;
    });
    
    if (attendance) {
      const user = await User.findById(userId);
      attendance = {
        ...attendance,
        userId: user ? { name: user.name, employeeId: user.employeeId } : userId
      };
    }

    res.json(attendance || null);
  } catch (error) {
    console.error("Get today attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
