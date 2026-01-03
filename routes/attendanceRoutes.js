const router = require("express").Router();
const {
  markCheckIn,
  markCheckOut,
  getMyAttendance,
  getAllAttendance,
  updateAttendance,
  getTodayAttendance
} = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/checkin", authMiddleware, markCheckIn);
router.post("/checkout", authMiddleware, markCheckOut);
router.get("/my", authMiddleware, getMyAttendance);
router.get("/today", authMiddleware, getTodayAttendance);
router.get("/all", authMiddleware, getAllAttendance);
router.put("/:attendanceId", authMiddleware, updateAttendance);

module.exports = router;

