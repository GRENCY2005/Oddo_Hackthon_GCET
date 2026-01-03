import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import "./Leave.css";

export default function Leave() {
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    type: "Paid",
    from: "",
    to: "",
    remarks: ""
  });
  const role = localStorage.getItem("role");
  const isHR = role === "HR";

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const res = await API.get(isHR ? "/leave/all" : "/leave/my");
      setLeaves(res.data);
    } catch (error) {
      console.error("Error loading leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await API.post("/leave/apply", formData);
      setMessage("Leave applied successfully!");
      setShowForm(false);
      setFormData({ type: "Paid", from: "", to: "", remarks: "" });
      loadLeaves();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to apply leave");
    }
  };

  const handleApprove = async (leaveId, action) => {
    try {
      const adminComments = prompt(
        action === "approve" ? "Add comments (optional):" : "Reason for rejection:"
      );

      await API.put(`/leave/${leaveId}/approve`, {
        action,
        adminComments: adminComments || ""
      });

      setMessage(`Leave request ${action === "approve" ? "approved" : "rejected"} successfully!`);
      loadLeaves();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to process request");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: "badge-pending",
      Approved: "badge-approved",
      Rejected: "badge-rejected"
    };
    return badges[status] || "badge-secondary";
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading leaves...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="leave-page">
        <div className="leave-header">
          <h1>Leave Management</h1>
          {!isHR && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Apply for Leave"}
            </button>
          )}
        </div>

        {message && (
          <div className={message.includes("success") ? "success-message" : "error-message"}>
            {message}
          </div>
        )}

        {!isHR && showForm && (
          <div className="leave-form-card">
            <h2>Apply for Leave</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Leave Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} required>
                    <option value="Paid">Paid Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>From Date</label>
                  <input
                    type="date"
                    name="from"
                    value={formData.from}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>To Date</label>
                  <input
                    type="date"
                    name="to"
                    value={formData.to}
                    onChange={handleChange}
                    min={formData.from || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="input-group full-width">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Add any additional remarks..."
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                Submit Leave Request
              </button>
            </form>
          </div>
        )}

        <div className="leave-list-card">
          <h2>{isHR ? "All Leave Requests" : "My Leave Requests"}</h2>

          {leaves.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  {isHR && <th>Employee</th>}
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  {isHR && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => {
                  const days = Math.ceil(
                    (new Date(leave.to) - new Date(leave.from)) / (1000 * 60 * 60 * 24) + 1
                  );
                  return (
                    <tr key={leave._id}>
                      {isHR && (
                        <td>
                          {leave.userId?.name || "Unknown"} ({leave.userId?.employeeId || "N/A"})
                        </td>
                      )}
                      <td>{leave.type}</td>
                      <td>{new Date(leave.from).toLocaleDateString()}</td>
                      <td>{new Date(leave.to).toLocaleDateString()}</td>
                      <td>{days} day{days !== 1 ? "s" : ""}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td>{leave.remarks || "-"}</td>
                      {isHR && (
                        <td>
                          {leave.status === "Pending" && (
                            <div className="action-buttons">
                              <button
                                className="btn btn-success"
                                onClick={() => handleApprove(leave._id, "approve")}
                                style={{ padding: "6px 12px", fontSize: "14px" }}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleApprove(leave._id, "reject")}
                                style={{ padding: "6px 12px", fontSize: "14px" }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {leave.status !== "Pending" && leave.adminComments && (
                            <small style={{ color: "#666" }}>{leave.adminComments}</small>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No leave requests found</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
