import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const role = localStorage.getItem("role");
  const isHR = role === "HR";

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await API.get("/auth/profile");
      setProfile(res.data);
      setFormData(res.data);
    } catch (error) {
      console.error("Error loading profile:", error);
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
      await API.put("/auth/profile", formData);
      setMessage("Profile updated successfully!");
      setEditing(false);
      loadProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-header">
          <h1>Profile</h1>
          {!editing && (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={message.includes("success") ? "success-message" : "error-message"}>
            {message}
          </div>
        )}

        <div className="profile-card">
          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId || ""}
                    onChange={handleChange}
                    disabled={!isHR}
                  />
                </div>

                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    disabled={!isHR}
                  />
                </div>

                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    disabled
                  />
                </div>

                <div className="input-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>

                {isHR && (
                  <>
                    <div className="input-group">
                      <label>Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department || ""}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="input-group">
                      <label>Position</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position || ""}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="input-group">
                      <label>Role</label>
                      <select
                        name="role"
                        value={formData.role || ""}
                        onChange={handleChange}
                      >
                        <option value="Employee">Employee</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="input-group">
                  <label>Profile Picture URL</label>
                  <input
                    type="url"
                    name="profilePicture"
                    value={formData.profilePicture || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditing(false);
                    setFormData(profile);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="profile-picture">
                {profile.profilePicture ? (
                  <img src={profile.profilePicture} alt="Profile" />
                ) : (
                  <div className="profile-placeholder">
                    {profile.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Employee ID:</span>
                  <span className="detail-value">{profile.employeeId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{profile.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{profile.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{profile.phone || "Not provided"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{profile.address || "Not provided"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Department:</span>
                  <span className="detail-value">{profile.department || "Not assigned"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Position:</span>
                  <span className="detail-value">{profile.position || "Not assigned"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Role:</span>
                  <span className="detail-value">
                    <span className={`badge badge-${profile.role === "HR" ? "info" : "success"}`}>
                      {profile.role}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="profile-card">
          <h2>Job Details</h2>
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Department:</span>
              <span className="detail-value">{profile.department || "Not assigned"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Position:</span>
              <span className="detail-value">{profile.position || "Not assigned"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Employee ID:</span>
              <span className="detail-value">{profile.employeeId}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
