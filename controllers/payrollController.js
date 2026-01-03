const Payroll = require("../models/Payroll");
const User = require("../models/User");

exports.getMyPayroll = async (req, res) => {
  try {
    const userId = req.user.id;

    let payroll = await Payroll.findOne({ userId });

    if (!payroll) {
      // Create default payroll if doesn't exist
      payroll = await Payroll.create({
        userId,
        baseSalary: 0,
        allowances: 0,
        deductions: 0,
        netSalary: 0
      });
    }

    const user = await User.findById(userId);
    
    const { name, employeeId } = user || {};
    
    res.json({
      ...payroll,
      employee: user ? { name, employeeId } : null
    });
  } catch (error) {
    console.error("Get payroll error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllPayroll = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "Access denied" });
    }

    let payrolls = await Payroll.find();
    
    // Sort by updatedAt descending
    payrolls.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    
    // Populate userId
    const users = await User.find();
    payrolls = payrolls.map(payroll => {
      const user = users.find(u => u._id === payroll.userId);
      return {
        ...payroll,
        userId: user ? { 
          name: user.name, 
          employeeId: user.employeeId, 
          email: user.email,
          department: user.department,
          position: user.position
        } : payroll.userId
      };
    });

    res.json(payrolls);
  } catch (error) {
    console.error("Get all payroll error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updatePayroll = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { userId } = req.params;
    const { baseSalary, allowances, deductions } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate net salary
    const netSalary = (baseSalary || 0) + (allowances || 0) - (deductions || 0);

    const payroll = await Payroll.findOneAndUpdate(
      { userId },
      {
        $set: {
          baseSalary: baseSalary || 0,
          allowances: allowances || 0,
          deductions: deductions || 0,
          netSalary,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    // Populate userId with user data
    const payrollWithUser = {
      ...payroll,
      userId: { name: user.name, employeeId: user.employeeId, email: user.email }
    };

    res.json({ message: "Payroll updated successfully", payroll: payrollWithUser });
  } catch (error) {
    console.error("Update payroll error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPayrollByUser = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { userId } = req.params;

    let payroll = await Payroll.findOne({ userId });
    
    // Get user data once
    const user = await User.findById(userId);
    
    if (!payroll) {
      // Create default if doesn't exist
      payroll = await Payroll.create({
        userId,
        baseSalary: 0,
        allowances: 0,
        deductions: 0,
        netSalary: 0
      });
    }
    
    // Populate userId with user data
    if (user) {
      payroll = {
        ...payroll,
        userId: { 
          name: user.name, 
          employeeId: user.employeeId, 
          email: user.email,
          department: user.department,
          position: user.position
        }
      };
    }

    res.json(payroll);
  } catch (error) {
    console.error("Get payroll by user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
