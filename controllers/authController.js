const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Password validation rules
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!hasUpperCase) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!hasLowerCase) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!hasNumber) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: "Password must contain at least one special character" };
  }
  return { valid: true };
};

exports.register = async (req, res) => {
  try {
    const { employeeId, name, email, password, role } = req.body;

    // Validate required fields
    if (!employeeId || !name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? "Email already exists" : "Employee ID already exists" 
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    // Create user (email verification will be simulated - set to true for demo)
    const user = await User.create({
      employeeId,
      name,
      email,
      password: hashed,
      role,
      emailVerificationToken,
      emailVerified: true // For demo purposes, auto-verify
    });

    res.status(201).json({ 
      message: "Registered successfully. Email verification sent (simulated - auto-verified for demo)",
      userId: user._id
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle MongoDB connection errors
    if (error.name === 'MongoServerSelectionError' || error.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        message: "Cannot connect to database. Please start MongoDB service:\n1. Open services.msc\n2. Find 'MongoDB' service\n3. Right-click → Start\n\nOr use MongoDB Atlas (cloud) - see backend/start-mongodb.md"
      });
    }
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field === 'email' ? 'Email' : 'Employee ID'} already exists` 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ 
      message: error.message || "Server error during registration. Please check if MongoDB is running."
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check email verification (for demo, we auto-verify, but keeping check)
    if (user.emailVerified === false) {
      return res.status(400).json({ message: "Please verify your email before logging in" });
    }

    // Verify password exists
    if (!user.password) {
      console.error("User password missing for:", email);
      return res.status(500).json({ message: "Server error: User data corrupted" });
    }

    // Compare password
    let match;
    try {
      match = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error("Bcrypt compare error:", bcryptError);
      return res.status(500).json({ message: "Server error during password verification" });
    }
    
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        { id: user._id, role: user.role, employeeId: user.employeeId },
        process.env.JWT_SECRET || "default-secret-key",
        { expiresIn: "7d" }
      );
    } catch (jwtError) {
      console.error("JWT sign error:", jwtError);
      return res.status(500).json({ message: "Server error during token generation" });
    }

    // Return success response
    res.json({
      token,
      role: user.role || "Employee",
      name: user.name,
      employeeId: user.employeeId,
      userId: user._id
    });
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error details:", error.message);
    console.error("Stack:", error.stack);
    
    res.status(500).json({ 
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Remove sensitive data
    const { password, emailVerificationToken, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    let userId = req.user.id;
    const userRole = req.user.role;
    let updates = req.body;

    // Employees can only update limited fields
    if (userRole === "Employee") {
      const allowedFields = ["phone", "address", "profilePicture"];
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });
      updates = filteredUpdates;
    }

    // HR can update all fields except password and email
    if (userRole === "HR" && updates.userId) {
      userId = updates.userId; // HR can update other users
      delete updates.userId;
    }

    delete updates.password;
    delete updates.email;
    delete updates.emailVerified;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    );
    
    if (user) {
      const { password, emailVerificationToken, ...userData } = user;
      return res.json({ message: "Profile updated successfully", user: userData });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find();
    // Remove sensitive data from all users
    const safeUsers = users.map(user => {
      const { password, emailVerificationToken, ...userData } = user;
      return userData;
    });
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
