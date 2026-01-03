import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Layout.css";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>Dayflow HRMS</h2>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className={isActive("/dashboard") ? "active" : ""}>
            Dashboard
          </Link>
          <Link to="/profile" className={isActive("/profile") ? "active" : ""}>
            Profile
          </Link>
          <Link to="/attendance" className={isActive("/attendance") ? "active" : ""}>
            Attendance
          </Link>
          <Link to="/leave" className={isActive("/leave") ? "active" : ""}>
            Leave
          </Link>
          <Link to="/payroll" className={isActive("/payroll") ? "active" : ""}>
            Payroll
          </Link>
        </div>
        <div className="nav-user">
          <span>Welcome, {name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}

