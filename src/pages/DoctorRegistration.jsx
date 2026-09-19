import React, { useState } from "react";

function DoctorRegistration({ onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    specialization: "",
    qualification: "",
    experience_years: "",
    phone: "",
    consultation_fee: "",
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

    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      console.log("JWT Token exists:", !!token);

      if (!token) {
        setMessage("❌ Please login again. Token not found.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        "https://medcarefinalproject-production.up.railway.app/api/doctors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      console.log("Doctor API Response:", data);

      if (response.ok && data.success) {
        setMessage("✅ Doctor added successfully!");

        setFormData({
          name: "",
          email: "",
          password: "",
          department: "",
          specialization: "",
          qualification: "",
          experience_years: "",
          phone: "",
          consultation_fee: "",
        });
      } else {
        setMessage(
          "❌ " + (data.message || "Doctor registration failed.")
        );
      }
    } catch (error) {
      console.error("Add doctor error:", error);
      setMessage("❌ Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-registration-page">

      <div className="doctor-registration-header">
        <div>
          <h1>Add New Doctor</h1>
          <p>
            Register a new doctor in the hospital system
          </p>
        </div>
      </div>

      <form
        className="doctor-form"
        onSubmit={handleSubmit}
      >

        <div className="doctor-form-section">

          <h2>Basic Information</h2>

          <div className="doctor-form-grid">

            <div className="doctor-form-group">
              <label>Doctor Name *</label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter doctor name"
                required
              />
            </div>

            <div className="doctor-form-group">
              <label>Email *</label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="doctor@example.com"
                required
              />
            </div>

            <div className="doctor-form-group">
              <label>Password *</label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create login password"
                required
              />
            </div>

            <div className="doctor-form-group">
              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

          </div>
        </div>

        <div className="doctor-form-section">

          <h2>Professional Information</h2>

          <div className="doctor-form-grid">

            <div className="doctor-form-group">
              <label>Department</label>

              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Cardiology"
              />
            </div>

            <div className="doctor-form-group">
              <label>Specialization</label>

              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g. Cardiologist"
              />
            </div>

            <div className="doctor-form-group">
              <label>Qualification</label>

              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                placeholder="e.g. MBBS, MD"
              />
            </div>

            <div className="doctor-form-group">
              <label>Experience (Years)</label>

              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                placeholder="e.g. 5"
                min="0"
              />
            </div>

            <div className="doctor-form-group">
              <label>Consultation Fee (₹)</label>

              <input
                type="number"
                name="consultation_fee"
                value={formData.consultation_fee}
                onChange={handleChange}
                placeholder="e.g. 500"
                min="0"
              />
            </div>

          </div>
        </div>

        {message && (
          <div className="doctor-message">
            {message}
          </div>
        )}

        <div className="doctor-form-actions">

          <button
            type="button"
            className="doctor-cancel-btn"
            onClick={onBack}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="doctor-submit-btn"
            disabled={loading}
          >
            {loading
              ? "Adding Doctor..."
              : "+ Add Doctor"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default DoctorRegistration;