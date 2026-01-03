const router = require("express").Router();
const {
  getMyPayroll,
  getAllPayroll,
  updatePayroll,
  getPayrollByUser
} = require("../controllers/payrollController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/my", authMiddleware, getMyPayroll);
router.get("/all", authMiddleware, getAllPayroll);
router.get("/user/:userId", authMiddleware, getPayrollByUser);
router.put("/:userId", authMiddleware, updatePayroll);

module.exports = router;

