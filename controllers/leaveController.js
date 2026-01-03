const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

/* ================= APPLY LEAVE ================= */
exports.applyLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, from, to, remarks } = req.body;

    if (!type || !from || !to) {
      return res.status(400).json({ message: "Type, from date, and to date are required" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate > toDate) {
      return res.status(400).json({ message: "From date must be before to date" });
    }

    if (fromDate < today) {
      return res.status(400).json({ message: "Cannot apply leave for past dates" });
    }

    const leave = await Leave.create({
      userId,
      type,
      from: fromDate,
      to: toDate,
      remarks,
      status: "Pending"
    });

    res.status(201).json({ message: "Leave applied successfully", leave });
  } catch (error) {
    console.error("Apply leave error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= MY LEAVES ================= */
exports.getMyLeaves = async (req, res) => {
  try {
    let leaves = await Leave.find({ userId: req.user.id });
    
    // Populate approvedBy
    const users = await User.find();
    leaves = leaves.map(leave => {
      const approver = leave.approvedBy ? users.find(u => u._id === leave.approvedBy) : null;
      return {
        ...leave,
        approvedBy: approver ? { name: approver.name } : leave.approvedBy
      };
    });

    res.json(leaves);
  } catch (error) {
    console.error("Get leaves error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= ALL LEAVES (HR) ================= */
exports.getAllLeaves = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "Access denied" });
    }

    const query = req.query.status ? { status: req.query.status } : {};

    let leaves = await Leave.find(query);
    
    // Populate userId and approvedBy
    const users = await User.find();
    leaves = leaves.map(leave => {
      const user = users.find(u => u._id === leave.userId);
      const approver = leave.approvedBy ? users.find(u => u._id === leave.approvedBy) : null;
      return {
        ...leave,
        userId: user ? { name: user.name, employeeId: user.employeeId, email: user.email } : leave.userId,
        approvedBy: approver ? { name: approver.name } : leave.approvedBy
      };
    });

    res.json(leaves);
  } catch (error) {
    console.error("Get all leaves error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= APPROVE / REJECT LEAVE ================= */
exports.approveLeave = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { leaveId } = req.params;
    const { action, adminComments } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({ message: "Leave already processed" });
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        $set: {
          status: action === "approve" ? "Approved" : "Rejected",
          approvedBy: req.user.id,
          adminComments: adminComments || "",
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    /* ===== Update Attendance if Approved ===== */
    if (updatedLeave.status === "Approved") {
      const start = new Date(updatedLeave.from);
      const end = new Date(updatedLeave.to);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);

        await Attendance.findOneAndUpdate(
          { 
            userId: updatedLeave.userId, 
            date: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) } 
          },
          { 
            $set: { 
              status: "Leave", 
              userId: updatedLeave.userId, 
              date: date.toISOString()
            } 
          },
          { upsert: true, new: true }
        );
      }
    }

    res.json({
      message: `Leave ${updatedLeave.status.toLowerCase()} successfully`,
      leave: updatedLeave
    });
  } catch (error) {
    console.error("Approve leave error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= LEAVE STATS ================= */
exports.getLeaveStats = async (req, res) => {
  try {
    const userId =
      req.user.role === "HR" && req.query.userId
        ? req.query.userId
        : req.user.id;

    const leaves = await Leave.find({ userId });
    
    const stats = {
      total: leaves.length,
      pending: leaves.filter(l => l.status === "Pending").length,
      approved: leaves.filter(l => l.status === "Approved").length,
      rejected: leaves.filter(l => l.status === "Rejected").length
    };

    res.json(stats);
  } catch (error) {
    console.error("Leave stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
