import { useEffect, useState } from "react";

const API_BASE = "https://medcarefinalproject-production.up.railway.app";

function MedicalRecordRegistration({ onBack }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [user, setUser] = useState({});

  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_id: "",
    diagnosis: "",
    symptoms: "",
    treatment: "",
    notes: "",
    record_date: "",
  });

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // GET USER
  // =====================================================

  useEffect(() => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      setUser(storedUser);
    } catch (error) {
      console.error("User data error:", error);
      setUser({});
    }
  }, []);

  // =====================================================
  // FETCH PATIENTS + DOCTORS + APPOINTMENTS
  // =====================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);

        const token = getToken();

        if (!token) {
          alert(
            "Login session expired. Please login again."
          );
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          patientsResponse,
          doctorsResponse,
          appointmentsResponse,
        ] = await Promise.all([
          fetch(`${API_BASE}/api/patients`, {
            headers,
          }),

          fetch(`${API_BASE}/api/doctors`, {
            headers,
          }),

          fetch(`${API_BASE}/api/appointments`, {
            headers,
          }),
        ]);

        // =================================================
        // PATIENTS
        // =================================================

        const patientsData =
          await patientsResponse.json();

        if (
          patientsResponse.ok &&
          patientsData.success
        ) {
          setPatients(
            patientsData.patients || []
          );
        } else {
          console.error(
            "Patients:",
            patientsData.message ||
              "Failed to fetch patients"
          );
        }

        // =================================================
        // DOCTORS
        // =================================================

        const doctorsData =
          await doctorsResponse.json();

        if (
          doctorsResponse.ok &&
          doctorsData.success
        ) {
          setDoctors(
            doctorsData.doctors || []
          );
        } else {
          console.error(
            "Doctors:",
            doctorsData.message ||
              "Failed to fetch doctors"
          );
        }

        // =================================================
        // APPOINTMENTS
        // =================================================

        const appointmentsData =
          await appointmentsResponse.json();

        if (
          appointmentsResponse.ok &&
          appointmentsData.success
        ) {
          setAppointments(
            appointmentsData.appointments || []
          );
        } else {
          console.error(
            "Appointments:",
            appointmentsData.message ||
              "Failed to fetch appointments"
          );
        }
      } catch (error) {
        console.error(
          "Error fetching form data:",
          error
        );

        alert(
          "Unable to connect to server. Please make sure backend is running."
        );
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // HANDLE APPOINTMENT SELECTION
  // AUTO FILL PATIENT + DOCTOR
  // =====================================================

  const handleAppointmentChange = (e) => {
    const appointmentId = e.target.value;

    if (!appointmentId) {
      setFormData((prev) => ({
        ...prev,
        appointment_id: "",
      }));

      return;
    }

    const selectedAppointment =
      appointments.find(
        (appointment) =>
          Number(appointment.id) ===
          Number(appointmentId)
      );

    if (!selectedAppointment) {
      setFormData((prev) => ({
        ...prev,
        appointment_id: "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,

      appointment_id:
        selectedAppointment.id,

      patient_id:
        selectedAppointment.patient_id,

      doctor_id:
        selectedAppointment.doctor_id,
    }));
  };

  // =====================================================
  // FORMAT APPOINTMENT LABEL
  // =====================================================

  const getAppointmentLabel = (appointment) => {
    const patientName =
      appointment.patient_name ||
      `Patient #${appointment.patient_id}`;

    const doctorName =
      appointment.doctor_name ||
      `Doctor #${appointment.doctor_id}`;

    const department =
      appointment.department
        ? ` - ${appointment.department}`
        : "";

    const date = appointment.appointment_date
      ? new Date(
          appointment.appointment_date
        ).toLocaleDateString("en-IN")
      : "";

    const time =
      appointment.appointment_time || "";

    const status =
      appointment.status || "";

    return `#${appointment.id} | ${patientName} | Dr. ${doctorName}${department} | ${date} ${time} | ${status}`;
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.patient_id ||
      !formData.doctor_id ||
      !formData.diagnosis.trim() ||
      !formData.record_date
    ) {
      alert(
        "Please select Patient, Doctor, Diagnosis and Record Date."
      );
      return;
    }

    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        alert(
          "Login session expired. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/medical-records`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            patient_id:
              Number(formData.patient_id),

            doctor_id:
              Number(formData.doctor_id),

            appointment_id:
              formData.appointment_id
                ? Number(
                    formData.appointment_id
                  )
                : null,

            diagnosis:
              formData.diagnosis.trim(),

            symptoms:
              formData.symptoms.trim(),

            treatment:
              formData.treatment.trim(),

            notes:
              formData.notes.trim(),

            record_date:
              formData.record_date,
          }),
        }
      );

      const data =
        await response.json();

      // =================================================
      // SESSION
      // =================================================

      if (response.status === 401) {
        alert(
          "Session expired. Please login again."
        );
        return;
      }

      // =================================================
      // PERMISSION
      // =================================================

      if (response.status === 403) {
        alert(
          data.message ||
            "You do not have permission for this action."
        );
        return;
      }

      // =================================================
      // ERROR
      // =================================================

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to add medical record"
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      alert(
        "Medical record added successfully! ✅"
      );

      onBack();
    } catch (error) {
      console.error(
        "Error adding medical record:",
        error
      );

      alert(
        error.message ||
          "Unable to add medical record."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (dataLoading) {
    return (
      <div className="medical-record-registration-page">

        <div className="medical-record-form-header">

          <div className="medical-record-form-icon">
            📋
          </div>

          <div>
            <h1>Add Medical Record</h1>
            <p>
              Loading patients, doctors and appointments...
            </p>
          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="medical-record-registration-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="medical-record-form-header">

        <div className="medical-record-form-icon">
          📋
        </div>

        <div>
          <h1>Add Medical Record</h1>

          <p>
            Create and save a new patient medical record
          </p>
        </div>

      </div>

      {/* =================================================
          FORM
      ================================================= */}

      <form
        className="medical-record-form"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            BASIC INFORMATION
        ================================================= */}

        <div className="medical-form-section">

          <div className="medical-section-heading">

            <div className="medical-section-icon">
              🏥
            </div>

            <div>
              <h2>
                Medical Record Information
              </h2>

              <p>
                Enter the basic details of the medical record
              </p>
            </div>

          </div>

          <div className="medical-form-grid">

            {/* =================================================
                APPOINTMENT
            ================================================= */}

            <div className="medical-form-group full-width">

              <label>
                Select Appointment
              </label>

              <select
                name="appointment_id"
                value={
                  formData.appointment_id
                }
                onChange={
                  handleAppointmentChange
                }
              >

                <option value="">
                  Select Appointment (Optional)
                </option>

                {appointments.map(
                  (appointment) => (
                    <option
                      key={appointment.id}
                      value={appointment.id}
                    >
                      {getAppointmentLabel(
                        appointment
                      )}
                    </option>
                  )
                )}

              </select>

              <small
                style={{
                  display: "block",
                  marginTop: "7px",
                  color: "#64748b",
                }}
              >
                Select an appointment to automatically
                fill Patient and Doctor.
              </small>

            </div>

            {/* =================================================
                PATIENT
            ================================================= */}

            <div className="medical-form-group">

              <label>
                Patient <span>*</span>
              </label>

              <select
                name="patient_id"
                value={
                  formData.patient_id
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select Patient
                </option>

                {patients.map(
                  (patient) => (
                    <option
                      key={patient.id}
                      value={patient.id}
                    >
                      {patient.name ||
                        patient.patient_name ||
                        `Patient #${patient.id}`}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* =================================================
                DOCTOR
            ================================================= */}

            <div className="medical-form-group">

              <label>
                Doctor <span>*</span>
              </label>

              <select
                name="doctor_id"
                value={
                  formData.doctor_id
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select Doctor
                </option>

                {doctors.map(
                  (doctor) => (
                    <option
                      key={doctor.id}
                      value={doctor.id}
                    >
                      Dr.{" "}
                      {doctor.name ||
                        doctor.doctor_name ||
                        `Doctor #${doctor.id}`}
                      {doctor.department
                        ? ` - ${doctor.department}`
                        : ""}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* =================================================
                RECORD DATE
            ================================================= */}

            <div className="medical-form-group">

              <label>
                Record Date <span>*</span>
              </label>

              <input
                type="date"
                name="record_date"
                value={
                  formData.record_date
                }
                onChange={handleChange}
                required
              />

            </div>

            {/* =================================================
                DIAGNOSIS
            ================================================= */}

            <div className="medical-form-group full-width">

              <label>
                Diagnosis <span>*</span>
              </label>

              <input
                type="text"
                name="diagnosis"
                value={
                  formData.diagnosis
                }
                onChange={handleChange}
                placeholder="Enter patient diagnosis"
                required
              />

            </div>

          </div>

        </div>

        {/* =================================================
            SYMPTOMS
        ================================================= */}

        <div className="medical-form-section">

          <div className="medical-section-heading">

            <div className="medical-section-icon">
              🩺
            </div>

            <div>
              <h2>Symptoms</h2>

              <p>
                Describe the symptoms reported by the patient
              </p>
            </div>

          </div>

          <div className="medical-form-group">

            <label>
              Patient Symptoms
            </label>

            <textarea
              name="symptoms"
              value={
                formData.symptoms
              }
              onChange={handleChange}
              placeholder="Enter patient symptoms..."
              rows="5"
            />

          </div>

        </div>

        {/* =================================================
            TREATMENT
        ================================================= */}

        <div className="medical-form-section">

          <div className="medical-section-heading">

            <div className="medical-section-icon">
              💊
            </div>

            <div>
              <h2>Treatment</h2>

              <p>
                Enter treatment and medication details
              </p>
            </div>

          </div>

          <div className="medical-form-group">

            <label>
              Treatment Details
            </label>

            <textarea
              name="treatment"
              value={
                formData.treatment
              }
              onChange={handleChange}
              placeholder="Enter treatment details..."
              rows="5"
            />

          </div>

        </div>

        {/* =================================================
            NOTES
        ================================================= */}

        <div className="medical-form-section">

          <div className="medical-section-heading">

            <div className="medical-section-icon">
              📝
            </div>

            <div>
              <h2>Additional Notes</h2>

              <p>
                Add follow-up instructions or important notes
              </p>
            </div>

          </div>

          <div className="medical-form-group">

            <label>
              Notes
            </label>

            <textarea
              name="notes"
              value={
                formData.notes
              }
              onChange={handleChange}
              placeholder="Enter additional notes..."
              rows="5"
            />

          </div>

        </div>

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="medical-form-actions">

          <button
            type="button"
            className="medical-cancel-btn"
            onClick={onBack}
            disabled={loading}
          >
            ← Cancel
          </button>

          <button
            type="submit"
            className="medical-save-btn"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : "✓ Save Medical Record"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default MedicalRecordRegistration;