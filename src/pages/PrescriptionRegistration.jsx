import React, { useEffect, useState } from "react";

function PrescriptionRegistration({ onBack }) {
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] =
    useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    appointment_id: "",
    patient_id: "",
    doctor_id: "",
    diagnosis: "",
    medicines: "",
    instructions: "",
  });

  // ==========================================
  // USER / ROLE
  // ==========================================

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const role = user?.role;

  const isAdmin = role === "admin";
  const isDoctor = role === "doctor";

  // ==========================================
  // TOKEN
  // ==========================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ==========================================
  // FETCH APPOINTMENTS
  // ==========================================

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);

      const token = getToken();

      if (!token) {
        alert("Please login again.");
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:5000/api/appointments",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "Appointments for prescription:",
        data
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        alert(
          data.message ||
            "Your login session has expired."
        );
        return;
      }

      if (data.success) {
        setAppointments(data.appointments || []);
      } else {
        alert(
          data.message ||
            "Failed to fetch appointments."
        );
      }
    } catch (error) {
      console.error(
        "Appointments error:",
        error
      );

      alert("Server connection failed.");
    } finally {
      setLoadingAppointments(false);
    }
  };

  // ==========================================
  // LOAD
  // ==========================================

  useEffect(() => {
    fetchAppointments();
  }, []);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "-";
    }

    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (time) => {
    if (!time) return "";

    const parts = String(time).split(":");

    if (parts.length < 2) {
      return time;
    }

    let hours = Number(parts[0]);
    const minutes = parts[1];

    if (Number.isNaN(hours)) {
      return time;
    }

    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;

    if (hours === 0) {
      hours = 12;
    }

    return `${hours}:${minutes} ${period}`;
  };

  // ==========================================
  // GET PATIENT NAME
  // ==========================================

  const getPatientName = (appointment) => {
    return (
      appointment.patient_name ||
      appointment.patientName ||
      `Patient #${appointment.patient_id}`
    );
  };

  // ==========================================
  // GET DOCTOR NAME
  // ==========================================

  const getDoctorName = (appointment) => {
    return (
      appointment.doctor_name ||
      appointment.doctorName ||
      `Doctor #${appointment.doctor_id}`
    );
  };

  // ==========================================
  // GET DEPARTMENT
  // ==========================================

  const getDepartment = (appointment) => {
    return (
      appointment.department ||
      appointment.doctor_department ||
      ""
    );
  };

  // ==========================================
  // APPOINTMENT CHANGE
  // ==========================================

  const handleAppointmentChange = (e) => {
    const appointmentId = e.target.value;

    if (!appointmentId) {
      setFormData({
        appointment_id: "",
        patient_id: "",
        doctor_id: "",
        diagnosis: "",
        medicines: "",
        instructions: "",
      });

      return;
    }

    const selectedAppointment =
      appointments.find(
        (appointment) =>
          String(appointment.id) ===
          String(appointmentId)
      );

    if (!selectedAppointment) {
      return;
    }

    console.log(
      "Selected appointment:",
      selectedAppointment
    );

    setFormData((prev) => ({
      ...prev,
      appointment_id: selectedAppointment.id,
      patient_id:
        selectedAppointment.patient_id || "",
      doctor_id:
        selectedAppointment.doctor_id || "",
    }));
  };

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!formData.appointment_id) {
      alert(
        "Please select an appointment."
      );
      return;
    }

    if (!formData.patient_id) {
      alert(
        "Patient information is missing."
      );
      return;
    }

    if (!formData.doctor_id) {
      alert(
        "Doctor information is missing."
      );
      return;
    }

    if (!formData.diagnosis.trim()) {
      alert(
        "Please enter diagnosis."
      );
      return;
    }

    if (!formData.medicines.trim()) {
      alert(
        "Please enter medicines."
      );
      return;
    }

    // ------------------------------------------
    // TOKEN
    // ------------------------------------------

    const token = getToken();

    if (!token) {
      alert("Please login again.");
      return;
    }

    // ------------------------------------------
    // PRESCRIPTION DATA
    // ------------------------------------------

    const prescriptionData = {
      appointment_id: Number(
        formData.appointment_id
      ),
      patient_id: Number(
        formData.patient_id
      ),
      doctor_id: Number(
        formData.doctor_id
      ),
      diagnosis:
        formData.diagnosis.trim(),
      medicines:
        formData.medicines.trim(),
      instructions:
        formData.instructions.trim() ||
        null,
    };

    console.log(
      "Creating prescription:",
      prescriptionData
    );

    // ------------------------------------------
    // SAVE
    // ------------------------------------------

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/api/prescriptions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            prescriptionData
          ),
        }
      );

      const data = await response.json();

      console.log(
        "Prescription response:",
        data
      );

      // ----------------------------------------
      // AUTH ERROR
      // ----------------------------------------

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        alert(
          data.message ||
            "You do not have permission to create a prescription."
        );
        return;
      }

      // ----------------------------------------
      // SUCCESS
      // ----------------------------------------

      if (data.success) {
        alert(
          "Prescription added successfully! ✅"
        );

        setFormData({
          appointment_id: "",
          patient_id: "",
          doctor_id: "",
          diagnosis: "",
          medicines: "",
          instructions: "",
        });

        if (onBack) {
          onBack();
        }
      } else {
        alert(
          data.message ||
            "Failed to add prescription."
        );
      }
    } catch (error) {
      console.error(
        "Prescription error:",
        error
      );

      alert(
        "Server connection failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >
      {/* ======================================
          BACK BUTTON
      ====================================== */}

      <div
        style={{
          marginBottom: "25px",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "12px 22px",
            borderRadius: "8px",
            cursor: loading
              ? "not-allowed"
              : "pointer",
            fontSize: "15px",
            fontWeight: "600",
          }}
        >
          ← Back to Prescriptions
        </button>
      </div>

      {/* ======================================
          MAIN CARD
      ====================================== */}

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#fff",
          padding: "35px",
          borderRadius: "16px",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.08)",
          boxSizing: "border-box",
        }}
      >
        {/* ====================================
            HEADER
        ==================================== */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "10px",
            }}
          >
            💊
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              color: "#111827",
            }}
          >
            Add Prescription
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginTop: "8px",
              marginBottom: 0,
            }}
          >
            Create a prescription for a completed
            or active patient appointment
          </p>
        </div>

        {/* ====================================
            FORM
        ==================================== */}

        <form onSubmit={handleSubmit}>

          {/* ==================================
              APPOINTMENT
          ================================== */}

          <div
            style={{
              marginBottom: "25px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Appointment *
            </label>

            <select
              name="appointment_id"
              value={
                formData.appointment_id
              }
              onChange={
                handleAppointmentChange
              }
              required
              disabled={
                loading ||
                loadingAppointments
              }
              style={{
                width: "100%",
                padding: "13px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "15px",
                background: "#fff",
                boxSizing: "border-box",
              }}
            >
              <option value="">
                {loadingAppointments
                  ? "Loading appointments..."
                  : "Select Appointment"}
              </option>

              {appointments.map(
                (appointment) => (
                  <option
                    key={appointment.id}
                    value={appointment.id}
                  >
                    #{appointment.id} —{" "}
                    {getPatientName(
                      appointment
                    )} —{" "}
                    {getDoctorName(
                      appointment
                    )} —{" "}
                    {formatDate(
                      appointment.appointment_date
                    )}{" "}
                    {formatTime(
                      appointment.appointment_time
                    )}
                  </option>
                )
              )}
            </select>

            {!loadingAppointments &&
              appointments.length === 0 && (
                <p
                  style={{
                    marginTop: "8px",
                    color: "#dc2626",
                    fontSize: "14px",
                  }}
                >
                  No appointments available for
                  prescription.
                </p>
              )}
          </div>

          {/* ==================================
              PATIENT + DOCTOR
          ================================== */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "20px",
              marginBottom: "25px",
            }}
          >
            {/* PATIENT */}

            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "#374151",
                }}
              >
                Patient
              </label>

              <input
                type="text"
                value={
                  formData.patient_id
                    ? `Patient ID: ${formData.patient_id}`
                    : "Select an appointment first"
                }
                readOnly
                style={{
                  width: "100%",
                  padding: "13px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "15px",
                  background: "#f9fafb",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* DOCTOR */}

            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "#374151",
                }}
              >
                Doctor
              </label>

              <input
                type="text"
                value={
                  formData.doctor_id
                    ? `Doctor ID: ${formData.doctor_id}`
                    : "Select an appointment first"
                }
                readOnly
                style={{
                  width: "100%",
                  padding: "13px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "15px",
                  background: "#f9fafb",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* ==================================
              SELECTED APPOINTMENT INFO
          ================================== */}

          {formData.appointment_id && (
            <div
              style={{
                background: "#eff6ff",
                border:
                  "1px solid #bfdbfe",
                borderRadius: "10px",
                padding: "15px 18px",
                marginBottom: "25px",
              }}
            >
              {(() => {
                const selectedAppointment =
                  appointments.find(
                    (appointment) =>
                      String(
                        appointment.id
                      ) ===
                      String(
                        formData.appointment_id
                      )
                  );

                if (!selectedAppointment) {
                  return null;
                }

                return (
                  <>
                    <strong
                      style={{
                        color: "#1d4ed8",
                      }}
                    >
                      Selected Appointment
                    </strong>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap: "8px 20px",
                        marginTop: "10px",
                        fontSize: "14px",
                        color: "#374151",
                      }}
                    >
                      <div>
                        <strong>
                          Appointment:
                        </strong>{" "}
                        #
                        {
                          selectedAppointment.id
                        }
                      </div>

                      <div>
                        <strong>
                          Patient:
                        </strong>{" "}
                        {getPatientName(
                          selectedAppointment
                        )}
                      </div>

                      <div>
                        <strong>
                          Doctor:
                        </strong>{" "}
                        {getDoctorName(
                          selectedAppointment
                        )}
                      </div>

                      <div>
                        <strong>
                          Department:
                        </strong>{" "}
                        {getDepartment(
                          selectedAppointment
                        ) || "-"}
                      </div>

                      <div>
                        <strong>
                          Date:
                        </strong>{" "}
                        {formatDate(
                          selectedAppointment.appointment_date
                        )}
                      </div>

                      <div>
                        <strong>
                          Time:
                        </strong>{" "}
                        {formatTime(
                          selectedAppointment.appointment_time
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ==================================
              DIAGNOSIS
          ================================== */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Diagnosis *
            </label>

            <input
              type="text"
              name="diagnosis"
              value={
                formData.diagnosis
              }
              onChange={handleChange}
              placeholder="Enter diagnosis"
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* ==================================
              MEDICINES
          ================================== */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Medicines *
            </label>

            <textarea
              name="medicines"
              value={
                formData.medicines
              }
              onChange={handleChange}
              placeholder={
                "Enter medicines and dosage\nExample: Paracetamol 500mg - Twice daily\nAmoxicillin 500mg - Three times daily"
              }
              required
              disabled={loading}
              rows="6"
              style={{
                width: "100%",
                padding: "13px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "15px",
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily:
                  "Arial, sans-serif",
                lineHeight: "1.5",
              }}
            />
          </div>

          {/* ==================================
              INSTRUCTIONS
          ================================== */}

          <div
            style={{
              marginBottom: "30px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Instructions
            </label>

            <textarea
              name="instructions"
              value={
                formData.instructions
              }
              onChange={handleChange}
              placeholder="Enter medicine instructions, diet advice, follow-up information, etc."
              disabled={loading}
              rows="5"
              style={{
                width: "100%",
                padding: "13px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "15px",
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily:
                  "Arial, sans-serif",
                lineHeight: "1.5",
              }}
            />
          </div>

          {/* ==================================
              BUTTONS
          ================================== */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              style={{
                padding: "13px 25px",
                border:
                  "1px solid #d1d5db",
                background: "#fff",
                color: "#374151",
                borderRadius: "8px",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                fontSize: "15px",
                fontWeight: "600",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                loadingAppointments ||
                appointments.length === 0
              }
              style={{
                padding: "13px 30px",
                border: "none",
                background:
                  loading ||
                  loadingAppointments ||
                  appointments.length === 0
                    ? "#93c5fd"
                    : "#2563eb",
                color: "#fff",
                borderRadius: "8px",
                cursor:
                  loading ||
                  loadingAppointments ||
                  appointments.length === 0
                    ? "not-allowed"
                    : "pointer",
                fontSize: "15px",
                fontWeight: "600",
              }}
            >
              {loading
                ? "Saving..."
                : "💊 Add Prescription"}
            </button>
          </div>
        </form>
      </div>

      {/* ======================================
          RESPONSIVE NOTE
      ====================================== */}

      <style>
        {`
          @media (max-width: 700px) {
            div[style*="repeat(2, minmax(0, 1fr))"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default PrescriptionRegistration;