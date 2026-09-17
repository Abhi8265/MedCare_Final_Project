import { useEffect, useMemo, useState } from "react";

function PatientList({ onAddPatient }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingPatient, setEditingPatient] = useState(null);
  const [saving, setSaving] = useState(false);

  // SEARCH + FILTERS
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [bloodGroupFilter, setBloodGroupFilter] =
    useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // ==========================================
  // USER / ROLE
  // ==========================================

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";
  const isPatient = user?.role === "patient";

  // ==========================================
  // FETCH PATIENTS
  // ==========================================

  const fetchPatients = async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Login session expired. Please login again.");
        return;
      }

      const url = searchValue.trim()
        ? `http://127.0.0.1:5000/api/patients?search=${encodeURIComponent(
            searchValue.trim()
          )}`
        : "http://127.0.0.1:5000/api/patients";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPatients(data.patients || []);
      } else {
        setError(
          data.message || "Failed to load patients"
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Server se connection nahi ho pa raha."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SEARCH WITH DEBOUNCE
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // ==========================================
  // FILTER + SORT
  // ==========================================

  const filteredPatients = useMemo(() => {
    let result = [...patients];

    // Gender filter
    if (genderFilter !== "all") {
      result = result.filter(
        (patient) =>
          String(patient.gender || "").toLowerCase() ===
          genderFilter.toLowerCase()
      );
    }

    // Blood group filter
    if (bloodGroupFilter !== "all") {
      result = result.filter(
        (patient) =>
          String(patient.blood_group || "")
            .toUpperCase() ===
          bloodGroupFilter.toUpperCase()
      );
    }

    // Sort
    if (sortBy === "name-asc") {
      result.sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
      );
    }

    if (sortBy === "name-desc") {
      result.sort((a, b) =>
        String(b.name || "").localeCompare(
          String(a.name || "")
        )
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
    }

    if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.created_at || 0) -
          new Date(b.created_at || 0)
      );
    }

    return result;
  }, [
    patients,
    genderFilter,
    bloodGroupFilter,
    sortBy,
  ]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {
    setSearch("");
    setGenderFilter("all");
    setBloodGroupFilter("all");
    setSortBy("newest");
  };

  const hasFilters =
    search.trim() ||
    genderFilter !== "all" ||
    bloodGroupFilter !== "all" ||
    sortBy !== "newest";

  // ==========================================
  // DELETE PATIENT
  // ==========================================

  const handleDelete = async (id, name) => {
    if (!isAdmin) {
      alert(
        "You do not have permission to delete patients."
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${name}?`
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://127.0.0.1:5000/api/patients/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setPatients((currentPatients) =>
          currentPatients.filter(
            (patient) => patient.id !== id
          )
        );

        alert("Patient deleted successfully.");
      } else {
        alert(
          data.message ||
            "Failed to delete patient."
        );
      }
    } catch (err) {
      console.error(err);

      alert(
        "Server se connection nahi ho pa raha."
      );
    }
  };

  // ==========================================
  // EDIT PATIENT
  // ==========================================

  const handleEdit = (patient) => {
    if (!isAdmin) {
      alert(
        "Only admin can edit patient information."
      );
      return;
    }

    setEditingPatient({
      ...patient,
      date_of_birth: patient.date_of_birth
        ? String(patient.date_of_birth).substring(
            0,
            10
          )
        : "",
    });
  };

  const handleEditChange = (e) => {
    setEditingPatient({
      ...editingPatient,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      alert(
        "Only admin can update patients."
      );
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://127.0.0.1:5000/api/patients/${editingPatient.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingPatient),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Patient updated successfully.");

        setEditingPatient(null);

        fetchPatients(search);
      } else {
        alert(
          data.message ||
            "Failed to update patient."
        );
      }
    } catch (err) {
      console.error(err);

      alert(
        "Server se connection nahi ho pa raha."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN");
  };

  // ==========================================
  // VIEW PATIENT
  // ==========================================

  const handleView = (patient) => {
    alert(
      `Patient Details\n\n` +
        `UHID: ${
          patient.patient_code || "-"
        }\n` +
        `Patient: ${
          patient.name || "-"
        }\n` +
        `Email: ${
          patient.email || "-"
        }\n` +
        `Phone: ${
          patient.phone || "-"
        }\n` +
        `Gender: ${
          patient.gender || "-"
        }\n` +
        `Blood Group: ${
          patient.blood_group || "-"
        }\n` +
        `Date of Birth: ${
          patient.date_of_birth || "-"
        }\n` +
        `Emergency Contact: ${
          patient.emergency_contact || "-"
        }\n` +
        `Address: ${
          patient.address || "-"
        }`
    );
  };

  // ==========================================
  // EDIT SCREEN
  // ==========================================

  if (editingPatient) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setEditingPatient(null)
            }
          >
            ← Back to Patients
          </button>
        </div>

        <div className="registration-container">
          <div className="registration-header">
            <h1>Edit Patient</h1>

            <p>
              Update patient information
            </p>
          </div>

          {/* UHID */}
          <div
            style={{
              marginBottom: "20px",
              padding: "15px 18px",
              background: "#eef6ff",
              border: "1px solid #d7eaff",
              borderRadius: "10px",
            }}
          >
            <strong>Patient UHID: </strong>

            <span
              style={{
                color: "#1769aa",
                fontWeight: "700",
                marginLeft: "5px",
              }}
            >
              {editingPatient.patient_code ||
                "-"}
            </span>

            <div
              style={{
                fontSize: "13px",
                color: "#64748b",
                marginTop: "5px",
              }}
            >
              UHID is permanent and cannot be
              changed.
            </div>
          </div>

          <form
            className="registration-form"
            onSubmit={handleUpdate}
          >
            <div className="form-section">
              <h2>Personal Information</h2>

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>

                  <input
                    name="name"
                    value={
                      editingPatient.name || ""
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>

                  <input
                    type="email"
                    name="email"
                    value={
                      editingPatient.email || ""
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>

                  <input
                    name="phone"
                    value={
                      editingPatient.phone || ""
                    }
                    onChange={
                      handleEditChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>

                  <input
                    type="date"
                    name="date_of_birth"
                    value={
                      editingPatient.date_of_birth ||
                      ""
                    }
                    onChange={
                      handleEditChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>

                  <select
                    name="gender"
                    value={
                      editingPatient.gender || ""
                    }
                    onChange={
                      handleEditChange
                    }
                  >
                    <option value="">
                      Select Gender
                    </option>

                    <option value="male">
                      Male
                    </option>

                    <option value="female">
                      Female
                    </option>

                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Blood Group</label>

                  <input
                    name="blood_group"
                    value={
                      editingPatient.blood_group ||
                      ""
                    }
                    onChange={
                      handleEditChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Emergency Contact
                  </label>

                  <input
                    name="emergency_contact"
                    value={
                      editingPatient.emergency_contact ||
                      ""
                    }
                    onChange={
                      handleEditChange
                    }
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
                  value={
                    editingPatient.address || ""
                  }
                  onChange={
                    handleEditChange
                  }
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  setEditingPatient(null)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="register-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // PATIENT LIST SCREEN
  // ==========================================

  return (
    <div className="patient-page">
      <div className="top-bar">
        <button
          onClick={() => window.history.back()}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="patients-container">
        {/* ======================================
            HEADER
        ====================================== */}

        <div className="patients-header">
          <div>
            <h1>Patients</h1>

            <p>
              {isAdmin
                ? "Manage all registered patients"
                : isDoctor
                ? "Search and view registered patients"
                : "View your patient information"}
            </p>
          </div>

          {/* ADMIN ONLY */}
          {isAdmin && (
            <button
              className="add-patient-btn"
              onClick={onAddPatient}
            >
              + Add Patient
            </button>
          )}
        </div>

        {/* ======================================
            SEARCH + FILTER AREA
        ====================================== */}

        <div
          style={{
            marginTop: "22px",
            marginBottom: "22px",
            padding: "18px",
            background: "#ffffff",
            border: "1px solid #e5eaf0",
            borderRadius: "14px",
            boxShadow:
              "0 4px 18px rgba(15, 23, 42, 0.04)",
          }}
        >
          {/* Search */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                position: "relative",
                flex: 1,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "15px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  fontSize: "18px",
                }}
              >
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by UHID, Name or Phone..."
                style={{
                  width: "100%",
                  padding:
                    "13px 15px 13px 45px",
                  border:
                    "1px solid #d9e2ec",
                  borderRadius: "10px",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                style={{
                  padding: "12px 18px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: "#eef2f7",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                }}
              >
                ✕ Clear Search
              </button>
            )}
          </div>

          {/* Filters */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(180px, 1fr)) auto",
              gap: "12px",
              alignItems: "center",
            }}
          >
            {/* Gender */}
            <select
              value={genderFilter}
              onChange={(e) =>
                setGenderFilter(
                  e.target.value
                )
              }
              style={filterStyle}
            >
              <option value="all">
                👤 All Genders
              </option>

              <option value="male">
                Male
              </option>

              <option value="female">
                Female
              </option>

              <option value="other">
                Other
              </option>
            </select>

            {/* Blood Group */}
            <select
              value={bloodGroupFilter}
              onChange={(e) =>
                setBloodGroupFilter(
                  e.target.value
                )
              }
              style={filterStyle}
            >
              <option value="all">
                🩸 All Blood Groups
              </option>

              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              style={filterStyle}
            >
              <option value="newest">
                ↕ Newest First
              </option>

              <option value="oldest">
                ↕ Oldest First
              </option>

              <option value="name-asc">
                A → Z Name
              </option>

              <option value="name-desc">
                Z → A Name
              </option>
            </select>

            {/* Clear All */}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  padding: "12px 18px",
                  border:
                    "1px solid #fecaca",
                  borderRadius: "9px",
                  background: "#fff5f5",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* ======================================
            SUMMARY
        ====================================== */}

        <div className="patient-summary">
          <div className="patient-summary-icon">
            🧑‍🤝‍🧑
          </div>

          <div>
            <p>
              {hasFilters
                ? "Filtered Patients"
                : isPatient
                ? "My Patient Record"
                : "Total Patients"}
            </p>

            <h2>
              {filteredPatients.length}
              {hasFilters &&
                ` / ${patients.length}`}
            </h2>
          </div>
        </div>

        {/* ======================================
            LOADING
        ====================================== */}

        {loading && (
          <div className="loading">
            Loading patients...
          </div>
        )}

        {/* ======================================
            ERROR
        ====================================== */}

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {/* ======================================
            EMPTY
        ====================================== */}

        {!loading &&
          !error &&
          filteredPatients.length === 0 && (
            <div className="patients-table-card">
              <div className="empty-state">
                <div>🧑‍🤝‍🧑</div>

                <h3>
                  {hasFilters
                    ? "No Matching Patients"
                    : isPatient
                    ? "Patient Record Not Found"
                    : "No Patients Found"}
                </h3>

                <p>
                  {hasFilters
                    ? "Try changing your search or filters."
                    : "Add your first patient to the hospital system."}
                </p>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    style={{
                      marginTop: "12px",
                      padding:
                        "10px 18px",
                      border: "none",
                      borderRadius: "8px",
                      background:
                        "#2563eb",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: "700",
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

        {/* ======================================
            PATIENT TABLE
        ====================================== */}

        {!loading &&
          !error &&
          filteredPatients.length > 0 && (
            <div className="patients-table-card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>UHID</th>
                      <th>Patient</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Gender</th>
                      <th>Blood Group</th>
                      <th>Registered</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPatients.map(
                      (patient) => (
                        <tr key={patient.id}>
                          {/* ID */}
                          <td>
                            <span className="patient-id">
                              #{patient.id}
                            </span>
                          </td>

                          {/* UHID */}
                          <td>
                            <span
                              style={{
                                display:
                                  "inline-block",
                                padding:
                                  "6px 10px",
                                borderRadius:
                                  "7px",
                                background:
                                  "#eef6ff",
                                color:
                                  "#1769aa",
                                fontWeight:
                                  "700",
                                fontSize:
                                  "13px",
                                letterSpacing:
                                  "0.3px",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {patient.patient_code ||
                                "-"}
                            </span>
                          </td>

                          {/* PATIENT */}
                          <td>
                            <div className="patient-cell">
                              <div className="patient-avatar">
                                {patient.name
                                  ? patient.name
                                      .charAt(0)
                                      .toUpperCase()
                                  : "P"}
                              </div>

                              <strong>
                                {patient.name}
                              </strong>
                            </div>
                          </td>

                          {/* EMAIL */}
                          <td>
                            {patient.email}
                          </td>

                          {/* PHONE */}
                          <td>
                            {patient.phone ||
                              "-"}
                          </td>

                          {/* GENDER */}
                          <td>
                            {patient.gender
                              ? patient.gender
                                  .charAt(0)
                                  .toUpperCase() +
                                patient.gender.slice(
                                  1
                                )
                              : "-"}
                          </td>

                          {/* BLOOD GROUP */}
                          <td>
                            <span className="blood-badge">
                              {patient.blood_group ||
                                "-"}
                            </span>
                          </td>

                          {/* REGISTERED */}
                          <td>
                            {formatDate(
                              patient.created_at
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td>
                            <div className="patient-actions">
                              {/* VIEW */}
                              <button
                                className="view-btn"
                                title="View Patient"
                                onClick={() =>
                                  handleView(
                                    patient
                                  )
                                }
                              >
                                👁️
                              </button>

                              {/* EDIT ADMIN */}
                              {isAdmin && (
                                <button
                                  className="edit-btn"
                                  title="Edit Patient"
                                  onClick={() =>
                                    handleEdit(
                                      patient
                                    )
                                  }
                                >
                                  ✏️
                                </button>
                              )}

                              {/* DELETE ADMIN */}
                              {isAdmin && (
                                <button
                                  className="delete-btn"
                                  title="Delete Patient"
                                  onClick={() =>
                                    handleDelete(
                                      patient.id,
                                      patient.name
                                    )
                                  }
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* ======================================
            PATIENT VIEW ONLY MESSAGE
        ====================================== */}

        {isPatient && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px 15px",
              borderRadius: "9px",
              background: "#f8fafc",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            🔒 Patient information is available
            in view-only mode.
          </div>
        )}

        {/* ======================================
            DOCTOR INFORMATION
        ====================================== */}

        {isDoctor && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px 15px",
              borderRadius: "9px",
              background: "#f8fafc",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            👨‍⚕️ Doctor access: Search and
            view patient information.
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// STYLES
// ==========================================

const filterStyle = {
  width: "100%",
  padding: "12px 13px",
  border: "1px solid #d9e2ec",
  borderRadius: "9px",
  background: "#fff",
  color: "#334155",
  fontSize: "14px",
  outline: "none",
  cursor: "pointer",
  boxSizing: "border-box",
};

export default PatientList;