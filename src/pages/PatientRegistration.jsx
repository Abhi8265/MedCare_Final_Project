import { useState } from "react";

function PatientRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    address: "",
    emergency_contact: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      // Login ke time save hua JWT token
      const token = localStorage.getItem("token");

      // Agar token nahi mila
      if (!token) {
        setMessage("❌ Login session expire ho gaya. Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:5000/api/patients",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("✅ Patient registered successfully!");

        setFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          date_of_birth: "",
          gender: "",
          blood_group: "",
          address: "",
          emergency_contact: "",
        });
      } else if (response.status === 401) {
        setMessage("❌ Login session expire ho gaya. Please login again.");
      } else if (response.status === 403) {
        setMessage("❌ Access denied. Token invalid ya expired hai.");
      } else {
        setMessage(
          `❌ ${data.message || "Patient registration failed."}`
        );
      }
    } catch (error) {
      console.error("Patient registration error:", error);
      setMessage(
        "❌ Server se connection nahi ho pa raha."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container">

      <div className="registration-header">
        <h1>Patient Registration</h1>
        <p>Add a new patient to the hospital system</p>
      </div>

      <form
        className="registration-form"
        onSubmit={handleSubmit}
      >

        <div className="form-section">
          <h2>Personal Information</h2>

          <div className="form-grid">

            <div className="form-group">
              <label>Full Name *</label>

              <input
                name="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>

              <input
                name="email"
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password *</label>

              <input
                name="password"
                type="password"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>

              <input
                name="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>

              <input
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Gender</label>

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Blood Group</label>

              <input
                name="blood_group"
                placeholder="Example: O+"
                value={formData.blood_group}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Emergency Contact</label>

              <input
                name="emergency_contact"
                placeholder="Emergency phone"
                value={formData.emergency_contact}
                onChange={handleChange}
              />
            </div>

          </div>
        </div>

        <div className="form-section">
          <h2>Address</h2>

          <div className="form-group">
            <label>Full Address</label>

            <textarea
              name="address"
              placeholder="Enter patient's address"
              value={formData.address}
              onChange={handleChange}
              rows="4"
            />
          </div>
        </div>

        <div className="form-actions">

          <button
            type="submit"
            className="register-btn"
            disabled={loading}
          >
            {loading
              ? "Registering..."
              : "Register Patient"}
          </button>

        </div>

        {message && (
          <div className="form-message">
            {message}
          </div>
        )}

      </form>

    </div>
  );
}

export default PatientRegistration;