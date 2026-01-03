import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import "./Attendance.css";

export default function Attendance() {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const role = localStorage.getItem("role");
  const isHR = role === "HR";

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const [todayRes, recordsRes] = await Promise.all([
        API.get("/attendance/today"),
        API.get(isHR ? "/attendance/all" : "/attendance/my")
      ]);

      setTodayAttendance(todayRes.data);
      setAttendanceRecords(recordsRes.data);
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await API.post("/attendance/checkin");
      setMessage("Checked in successfully!");
      loadAttendance();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      await API.post("/attendance/checkout");
      setMessage("Checked out successfully!");
      loadAttendance();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to check out");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Present: "badge-success",
      Absent: "badge-danger",
      "Half-day": "badge-warning",
      Leave: "badge-info"
    };
    return badges[status] || "badge-secondary";
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading attendance...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="attendance-page">
        <h1>Attendance Management</h1>

        {message && (
          <div className={message.includes("success") ? "success-message" : "error-message"}>
            {message}
          </div>
        )}

        {!isHR && (
          <div className="check-in-out-card">
            <h2>Today's Attendance</h2>
            {todayAttendance ? (
              <div className="attendance-status">
                <div className="status-item">
                  <span className="status-label">Check In:</span>
                  <span className="status-value">
                    {todayAttendance.checkIn
                      ? new Date(todayAttendance.checkIn).toLocaleTimeString()
                      : "Not checked in"}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Check Out:</span>
                  <span className="status-value">
                    {todayAttendance.checkOut
                      ? new Date(todayAttendance.checkOut).toLocaleTimeString()
                      : "Not checked out"}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Status:</span>
                  <span className={`badge ${getStatusBadge(todayAttendance.status)}`}>
                    {todayAttendance.status}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Hours Worked:</span>
                  <span className="status-value">
                    {todayAttendance.hoursWorked || 0} hours
                  </span>
                </div>
              </div>
            ) : (
              <p>No attendance record for today</p>
            )}

            <div className="action-buttons">
              {!todayAttendance?.checkIn && (
                <button className="btn btn-success" onClick={handleCheckIn}>
                  Check In
                </button>
              )}
              {todayAttendance?.checkIn && !todayAttendance?.checkOut && (
                <button className="btn btn-danger" onClick={handleCheckOut}>
                  Check Out
                </button>
              )}
            </div>
          </div>
        )}

        <div className="attendance-records-card">
          <h2>{isHR ? "All Attendance Records" : "My Attendance Records"}</h2>

          {attendanceRecords.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  {isHR && <th>Employee</th>}
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record._id}>
                    {isHR && (
                      <td>
                        {record.userId?.name || "Unknown"} ({record.userId?.employeeId || "N/A"})
                      </td>
                    )}
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>
                      {record.checkIn
                        ? new Date(record.checkIn).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td>
                      {record.checkOut
                        ? new Date(record.checkOut).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td>{record.hoursWorked || 0}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No attendance records found</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
