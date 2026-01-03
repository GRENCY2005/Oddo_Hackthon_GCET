import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Register() {
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Employee"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = form;
      await API.post("/auth/register", registerData);
      
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        setError("Cannot connect to server. Please make sure the backend is running on http://localhost:5000");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Registration failed. Please check all fields and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Sign up for Dayflow HRMS</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Employee ID</label>
            <input
              type="text"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              placeholder="Enter employee ID"
              required
            />
          </div>

          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange} required>
              <option value="Employee">Employee</option>
              <option value="HR">HR</option>
            </select>
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password (min 8 chars, uppercase, lowercase, number, special char)"
              required
            />
            <small style={{ color: "#666", fontSize: "12px", marginTop: "4px", display: "block" }}>
              Must contain: 8+ characters, uppercase, lowercase, number, special character
            </small>
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <a href="/" className="link">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
