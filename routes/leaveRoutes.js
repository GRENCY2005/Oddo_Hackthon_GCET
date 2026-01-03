const router = require("express").Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  getLeaveStats
} = require("../controllers/leaveController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/apply", authMiddleware, applyLeave);
router.get("/my", authMiddleware, getMyLeaves);
router.get("/all", authMiddleware, getAllLeaves);
router.put("/:leaveId/approve", authMiddleware, approveLeave);
router.get("/stats", authMiddleware, getLeaveStats);

module.exports = router;

