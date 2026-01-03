const router = require("express").Router();
const { 
  register, 
  login, 
  verifyEmail, 
  getProfile, 
  updateProfile, 
  getAllUsers 
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.get("/users", authMiddleware, getAllUsers);

module.exports = router;
