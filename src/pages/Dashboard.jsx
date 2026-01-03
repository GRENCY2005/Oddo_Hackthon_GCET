import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../services/api";
import "./Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (role === "HR") {
        const [leavesRes, attendanceRes, usersRes] = await Promise.all([
          API.get("/leave/all?status=Pending"),
          API.get("/attendance/all"),
          API.get("/auth/users")
        ]);

        setStats({
          pendingLeaves: leavesRes.data.length,
          totalEmployees: usersRes.data.length,
          todayAttendance: attendanceRes.data.filter(
            (a) => new Date(a.date).toDateString() === new Date().toDateString()
          ).length
        });

        setRecentActivity(leavesRes.data.slice(0, 5));
      } else {
        const [leavesRes, attendanceRes, payrollRes] = await Promise.all([
          API.get("/leave/my"),
          API.get("/attendance/my"),
          API.get("/payroll/my")
        ]);

        setStats({
          pendingLeaves: leavesRes.data.filter((l) => l.status === "Pending").length,
          totalLeaves: leavesRes.data.length,
          attendanceDays: attendanceRes.data.filter((a) => a.status === "Present").length
        });

        setRecentActivity([
          ...leavesRes.data.slice(0, 3),
          ...attendanceRes.data.slice(0, 2)
        ]);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        <h1 className="dashboard-title">
          {role === "HR" ? "HR Dashboard" : "Employee Dashboard"}
        </h1>

        {role === "HR" ? (
          <HRDashboard stats={stats} recentActivity={recentActivity} navigate={navigate} />
        ) : (
          <EmployeeDashboard stats={stats} recentActivity={recentActivity} navigate={navigate} />
        )}
      </div>
    </Layout>
  );
}

function EmployeeDashboard({ stats, recentActivity, navigate }) {
  return (
    <>
      <div className="dashboard-cards">
        <div className="dashboard-card" onClick={() => navigate("/profile")}>
          <div className="card-icon">👤</div>
          <h3>Profile</h3>
          <p>View and edit your profile</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate("/attendance")}>
          <div className="card-icon">📅</div>
          <h3>Attendance</h3>
          <p>Check in/out and view records</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate("/leave")}>
          <div className="card-icon">🏖️</div>
          <h3>Leave Requests</h3>
          <p>{stats.pendingLeaves || 0} pending</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate("/payroll")}>
          <div className="card-icon">💰</div>
          <h3>Payroll</h3>
          <p>View your salary details</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h4>Total Leaves</h4>
          <p className="stat-number">{stats.totalLeaves || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Present Days (Last 30)</h4>
          <p className="stat-number">{stats.attendanceDays || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Pending Requests</h4>
          <p className="stat-number">{stats.pendingLeaves || 0}</p>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="activity-list">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="activity-item">
                {activity.type ? (
                  <>
                    <span className="activity-type">Leave</span>
                    <span>{activity.type} leave from {new Date(activity.from).toLocaleDateString()}</span>
                    <span className={`badge badge-${activity.status.toLowerCase()}`}>
                      {activity.status}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="activity-type">Attendance</span>
                    <span>{activity.status} on {new Date(activity.date).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No recent activity</div>
        )}
      </div>
    </>
  );
}

function HRDashboard({ stats, recentActivity, navigate }) {
  return (
    <>
      <div className="dashboard-cards">
        <div className="dashboard-card" onClick={() => navigate("/profile")}>
          <div className="card-icon">👥</div>
          <h3>Employee List</h3>
          <p>{stats.totalEmployees || 0} employees</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate("/attendance")}>
          <div className="card-icon">📊</div>
          <h3>Attendance Records</h3>
          <p>{stats.todayAttendance || 0} checked in today</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate("/leave")}>
          <div className="card-icon">✅</div>
          <h3>Leave Approvals</h3>
          <p>{stats.pendingLeaves || 0} pending requests</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate("/payroll")}>
          <div className="card-icon">💼</div>
          <h3>Payroll Management</h3>
          <p>Manage employee salaries</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h4>Total Employees</h4>
          <p className="stat-number">{stats.totalEmployees || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Today's Attendance</h4>
          <p className="stat-number">{stats.todayAttendance || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Pending Leaves</h4>
          <p className="stat-number">{stats.pendingLeaves || 0}</p>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Pending Leave Requests</h2>
        {recentActivity.length > 0 ? (
          <div className="activity-list">
            {recentActivity.map((leave) => (
              <div key={leave._id} className="activity-item">
                <span className="activity-type">Leave Request</span>
                <span>
                  {leave.userId?.name || "Employee"} - {leave.type} leave
                </span>
                <span className={`badge badge-${leave.status.toLowerCase()}`}>
                  {leave.status}
                </span>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/leave")}
                  style={{ marginLeft: "auto" }}
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No pending leave requests</div>
        )}
      </div>
    </>
  );
}
