import React, { useEffect, useState } from "react";

function AppointmentRegistration({ onBack }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    status: "confirmed",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const isAdmin = user?.role === "admin";
  const isPatient = user?.role === "patient";

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (!token) {
      setMessage("Login required.");
      return;
    }

    fetchPatients();
    fetchDoctors();

    if (isPatient && user?.id) {
      fetchCurrentPatient(user.id);
    }
  }, []);

  // =====================================================
  // GET PATIENTS
  // =====================================================

  const fetchPatients = async () => {
    try {
      const response = await fetch(
        "https://medcarefinalproject-production.up.railway.app/api/patients",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setPatients(data.patients || []);
      } else {
        console.error("Patients API:", data);
      }
    } catch (error) {
      console.error("Patients error:", error);
    }
  };

  // =====================================================
  // GET DOCTORS
  // =====================================================

  const fetchDoctors = async () => {
    try {
      const response = await fetch(
        "https://medcarefinalproject-production.up.railway.app/api/doctors",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log("Doctors API response:", data);

      if (response.ok && data.success) {
        setDoctors(data.doctors || []);
      } else {
        setMessage(
          data.message || "Failed to load doctors."
        );
      }
    } catch (error) {
      console.error("Doctors error:", error);
      setMessage("Failed to load doctors.");
    }
  };

  // =====================================================
  // GET CURRENT PATIENT
  // =====================================================

  const fetchCurrentPatient = async (userId) => {
    try {
      const response = await fetch(
        "https://medcarefinalproject-production.up.railway.app/api/patients",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const currentPatient = (
          data.patients || []
        ).find(
          (patient) =>
            String(patient.user_id) ===
            String(userId)
        );

        if (currentPatient) {
          setFormData((prev) => ({
            ...prev,
            patient_id: String(currentPatient.id),
          }));
        }
      }
    } catch (error) {
      console.error(
        "Current patient error:",
        error
      );
    }
  };

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (message) {
      setMessage("");
    }
  };

  // =====================================================
  // SUBMIT APPOINTMENT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    // -------------------------------
    // VALIDATION
    // -------------------------------

    if (!formData.patient_id) {
      setMessage("Please select a patient.");
      return;
    }

    if (!formData.doctor_id) {
      setMessage("Please select a doctor.");
      return;
    }

    if (!formData.appointment_date) {
      setMessage(
        "Please select appointment date."
      );
      return;
    }

    if (!formData.appointment_time) {
      setMessage(
        "Please select appointment time."
      );
      return;
    }

    // -------------------------------
    // PREVENT PAST DATE
    // -------------------------------

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const selectedDate = new Date(
      `${formData.appointment_date}T00:00:00`
    );

    if (selectedDate < today) {
      setMessage(
        "Appointment date cannot be in the past."
      );
      return;
    }

    setLoading(true);

    try {
      // =================================================
      // IMPORTANT:
      // Backend expects:
      // patient_id
      // doctor_id
      // appointment_date
      // appointment_time
      // =================================================

      const appointmentData = {
        patient_id: Number(
          formData.patient_id
        ),

        doctor_id: Number(
          formData.doctor_id
        ),

        appointment_date:
          formData.appointment_date,

        appointment_time:
          formData.appointment_time,

        reason:
          formData.reason.trim() || null,

        status: isAdmin
          ? formData.status
          : "confirmed",
      };

      console.log(
        "Booking appointment:",
        appointmentData
      );

      const response = await fetch(
        "https://medcarefinalproject-production.up.railway.app/api/appointments",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            appointmentData
          ),
        }
      );

      const data =
        await response.json();

      console.log(
        "Appointment API response:",
        data
      );

      // =================================================
      // SUCCESS
      // =================================================

      if (
        response.ok &&
        data.success
      ) {
        setMessage("success");

        setFormData({
          patient_id: isPatient
            ? formData.patient_id
            : "",

          doctor_id: "",

          appointment_date: "",

          appointment_time: "",

          reason: "",

          status: "confirmed",
        });

        return;
      }

      // =================================================
      // AUTH ERROR
      // =================================================

      if (
        response.status === 401
      ) {
        setMessage(
          "Your login session has expired. Please login again."
        );
        return;
      }

      if (
        response.status === 403
      ) {
        setMessage(
          data.message ||
            "You are not authorized to book this appointment."
        );
        return;
      }

      // =================================================
      // OTHER ERROR
      // =================================================

      setMessage(
        data.message ||
          "Failed to book appointment."
      );
    } catch (error) {
      console.error(
        "Appointment booking error:",
        error
      );

      setMessage(
        "Server connection failed. Please check backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // TODAY DATE
  // =====================================================

  const todayDate =
    new Date()
      .toISOString()
      .split("T")[0];

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="appointment-registration-page">

      {/* =================================================
          TOP BAR
      ================================================= */}

      <div className="appointment-topbar">

        <button
          type="button"
          className="appointment-back-btn"
          onClick={onBack}
          disabled={loading}
        >
          ← Back to Appointments
        </button>

      </div>

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="appointment-page-header">

        <div className="appointment-page-icon">
          📅
        </div>

        <h1>
          Book Appointment
        </h1>

        <p>
          Schedule a new patient appointment
        </p>

      </div>

      {/* =================================================
          FORM
      ================================================= */}

      <form
        className="appointment-form-card"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            SECTION HEADER
        ================================================= */}

        <div className="appointment-section-header">

          <div className="appointment-section-icon">
            🩺
          </div>

          <div>
            <h2>
              Appointment Information
            </h2>

            <p>
              Enter the details below to schedule
              an appointment
            </p>
          </div>

        </div>

        {/* =================================================
            FORM GRID
        ================================================= */}

        <div className="appointment-form-grid">

          {/* =================================================
              PATIENT
          ================================================= */}

          <div className="appointment-form-group">

            <label>
              Patient <span>*</span>
            </label>

            <div className="appointment-input-wrapper">

              <span>
                👤
              </span>

              <select
                name="patient_id"
                value={
                  formData.patient_id
                }
                onChange={
                  handleChange
                }
                required
                disabled={
                  isPatient ||
                  loading
                }
              >

                <option value="">
                  Select Patient
                </option>

                {patients.map(
                  (patient) => (
                    <option
                      key={
                        patient.id
                      }
                      value={
                        patient.id
                      }
                    >
                      {patient.name}

                      {patient.patient_code
                        ? ` - ${patient.patient_code}`
                        : ""}
                    </option>
                  )
                )}

              </select>

            </div>

            {isPatient && (
              <small>
                Your patient profile is automatically selected.
              </small>
            )}

          </div>

          {/* =================================================
              DOCTOR
          ================================================= */}

          <div className="appointment-form-group">

            <label>
              Doctor <span>*</span>
            </label>

            <div className="appointment-input-wrapper">

              <span>
                👨‍⚕️
              </span>

              <select
                name="doctor_id"
                value={
                  formData.doctor_id
                }
                onChange={
                  handleChange
                }
                required
                disabled={loading}
              >

                <option value="">
                  Select Doctor
                </option>

                {doctors.map(
                  (doctor) => (
                    <option
                      key={
                        doctor.id
                      }
                      value={
                        doctor.id
                      }
                    >
                      {doctor.name}

                      {doctor.department
                        ? ` - ${doctor.department}`
                        : ""}
                    </option>
                  )
                )}

              </select>

            </div>

            {doctors.length === 0 && (
              <small>
                No doctors available.
              </small>
            )}

          </div>

          {/* =================================================
              DATE
          ================================================= */}

          <div className="appointment-form-group">

            <label>
              Appointment Date{" "}
              <span>*</span>
            </label>

            <div className="appointment-input-wrapper">

              <span>
                📅
              </span>

              <input
                type="date"
                name="appointment_date"
                value={
                  formData.appointment_date
                }
                onChange={
                  handleChange
                }
                min={todayDate}
                required
                disabled={loading}
              />

            </div>

          </div>

          {/* =================================================
              TIME
          ================================================= */}

          <div className="appointment-form-group">

            <label>
              Appointment Time{" "}
              <span>*</span>
            </label>

            <div className="appointment-input-wrapper">

              <span>
                🕐
              </span>

              <input
                type="time"
                name="appointment_time"
                value={
                  formData.appointment_time
                }
                onChange={
                  handleChange
                }
                required
                disabled={loading}
              />

            </div>

          </div>

          {/* =================================================
              REASON
          ================================================= */}

          <div className="appointment-form-group appointment-full-width">

            <label>
              Reason / Appointment Type
            </label>

            <div className="appointment-input-wrapper">

              <span>
                📝
              </span>

              <input
                type="text"
                name="reason"
                value={
                  formData.reason
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. General Checkup, Follow-up, Consultation"
                maxLength={255}
                disabled={loading}
              />

            </div>

          </div>

          {/* =================================================
              STATUS
          ================================================= */}

          {isAdmin && (
            <div className="appointment-form-group">

              <label>
                Status
              </label>

              <div className="appointment-input-wrapper">

                <span>
                  ●
                </span>

                <select
                  name="status"
                  value={
                    formData.status
                  }
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                >

                  <option value="confirmed">
                    Confirmed
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>

                </select>

              </div>

            </div>
          )}

        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div
            className={
              message === "success"
                ? "appointment-success-message"
                : "appointment-error-message"
            }
          >

            {message === "success"
              ? "✓ Appointment booked successfully!"
              : `⚠ ${message}`}

          </div>
        )}

        {/* =================================================
            ACTION BUTTONS
        ================================================= */}

        <div className="appointment-form-actions">

          <button
            type="button"
            className="appointment-cancel-btn"
            onClick={onBack}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="appointment-submit-btn"
            disabled={loading}
          >

            {loading
              ? "Booking Appointment..."
              : "✓ Book Appointment"}

          </button>

        </div>

      </form>

      {/* =================================================
          FOOTER NOTE
      ================================================= */}

      <div className="appointment-security-note">

        🔒 Appointment information is securely stored
        in the hospital system.

      </div>

    </div>
  );
}

export default AppointmentRegistration;