import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import "./Payroll.css";

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    baseSalary: 0,
    allowances: 0,
    deductions: 0
  });
  const role = localStorage.getItem("role");
  const isHR = role === "HR";

  useEffect(() => {
    loadPayroll();
    if (isHR) {
      loadUsers();
    }
  }, []);

  const loadPayroll = async () => {
    try {
      if (isHR) {
        const res = await API.get("/payroll/all");
        setPayrolls(res.data);
      } else {
        const res = await API.get("/payroll/my");
        setPayrolls([res.data]);
      }
    } catch (error) {
      console.error("Error loading payroll:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await API.get("/auth/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleSelectUser = async (userId) => {
    try {
      const res = await API.get(`/payroll/user/${userId}`);
      setSelectedUser(res.data);
      setFormData({
        baseSalary: res.data.baseSalary || 0,
        allowances: res.data.allowances || 0,
        deductions: res.data.deductions || 0
      });
      setEditing(null);
    } catch (error) {
      console.error("Error loading user payroll:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const userId = editing || selectedUser?.userId?._id || payrolls[0]?.userId?._id;
      await API.put(`/payroll/${userId}`, formData);
      setMessage("Payroll updated successfully!");
      setEditing(null);
      loadPayroll();
      if (selectedUser) {
        handleSelectUser(userId);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update payroll");
    }
  };

  const calculateNet = () => {
    return (formData.baseSalary || 0) + (formData.allowances || 0) - (formData.deductions || 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading payroll...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="payroll-page">
        <h1>Payroll Management</h1>

        {message && (
          <div className={message.includes("success") ? "success-message" : "error-message"}>
            {message}
          </div>
        )}

        {isHR && (
          <div className="user-selector-card">
            <h2>Select Employee</h2>
            <select
              className="user-select"
              onChange={(e) => handleSelectUser(e.target.value)}
              value={selectedUser?.userId?._id || ""}
            >
              <option value="">Select an employee...</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.employeeId})
                </option>
              ))}
            </select>
          </div>
        )}

        {payrolls.length > 0 && (
          <div className="payroll-card">
            <div className="payroll-header">
              <h2>
                {isHR
                  ? selectedUser
                    ? `${selectedUser.userId?.name}'s Payroll`
                    : "Employee Payroll"
                  : "My Payroll"}
              </h2>
              {isHR && selectedUser && !editing && (
                <button className="btn btn-primary" onClick={() => setEditing(selectedUser.userId._id)}>
                  Edit Payroll
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSubmit}>
                <div className="payroll-form">
                  <div className="input-group">
                    <label>Base Salary</label>
                    <input
                      type="number"
                      name="baseSalary"
                      value={formData.baseSalary}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Allowances</label>
                    <input
                      type="number"
                      name="allowances"
                      value={formData.allowances}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Deductions</label>
                    <input
                      type="number"
                      name="deductions"
                      value={formData.deductions}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="net-salary-display">
                    <strong>Net Salary: {calculateNet().toLocaleString()} {payrolls[0]?.currency || "USD"}</strong>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditing(null);
                        if (selectedUser) {
                          setFormData({
                            baseSalary: selectedUser.baseSalary || 0,
                            allowances: selectedUser.allowances || 0,
                            deductions: selectedUser.deductions || 0
                          });
                        }
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="payroll-details">
                {payrolls.map((payroll) => (
                  <div key={payroll._id || payroll.userId?._id} className="payroll-breakdown">
                    <div className="breakdown-row">
                      <span className="breakdown-label">Employee:</span>
                      <span className="breakdown-value">
                        {payroll.userId?.name || payroll.employee?.name} (
                        {payroll.userId?.employeeId || payroll.employee?.employeeId})
                      </span>
                    </div>
                    <div className="breakdown-row">
                      <span className="breakdown-label">Base Salary:</span>
                      <span className="breakdown-value">
                        {payroll.baseSalary?.toLocaleString()} {payroll.currency || "USD"}
                      </span>
                    </div>
                    <div className="breakdown-row">
                      <span className="breakdown-label">Allowances:</span>
                      <span className="breakdown-value positive">
                        +{payroll.allowances?.toLocaleString()} {payroll.currency || "USD"}
                      </span>
                    </div>
                    <div className="breakdown-row">
                      <span className="breakdown-label">Deductions:</span>
                      <span className="breakdown-value negative">
                        -{payroll.deductions?.toLocaleString()} {payroll.currency || "USD"}
                      </span>
                    </div>
                    <div className="breakdown-row total">
                      <span className="breakdown-label">Net Salary:</span>
                      <span className="breakdown-value total-amount">
                        {payroll.netSalary?.toLocaleString()} {payroll.currency || "USD"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isHR && !selectedUser && (
          <div className="payroll-list-card">
            <h2>All Employee Payrolls</h2>
            {payrolls.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Base Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((payroll) => (
                    <tr key={payroll._id}>
                      <td>
                        {payroll.userId?.name || "Unknown"} ({payroll.userId?.employeeId || "N/A"})
                      </td>
                      <td>{payroll.baseSalary?.toLocaleString()}</td>
                      <td>{payroll.allowances?.toLocaleString()}</td>
                      <td>{payroll.deductions?.toLocaleString()}</td>
                      <td>
                        <strong>{payroll.netSalary?.toLocaleString()}</strong>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleSelectUser(payroll.userId?._id)}
                          style={{ padding: "6px 12px", fontSize: "14px" }}
                        >
                          View/Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No payroll records found</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
