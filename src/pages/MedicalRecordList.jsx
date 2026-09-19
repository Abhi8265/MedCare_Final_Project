import { useEffect, useMemo, useState } from "react";

function MedicalRecordList({ onAddRecord, canAdd = false }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);

  // =====================================================
  // FILTER STATES
  // =====================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [editForm, setEditForm] = useState({
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
  // USER
  // =====================================================

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const role = user?.role;

  const isAdmin = role === "admin";
  const isDoctor = role === "doctor";
  const isPatient = role === "patient";

  const canEdit = isAdmin || isDoctor;
  const canDelete = isAdmin;

  const API_URL =
    "https://medcarefinalproject-production.up.railway.app/api/medical-records";

  // =====================================================
  // FETCH MEDICAL RECORDS
  // =====================================================

  const fetchRecords = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Login session expired. Please login again.");
        return;
      }

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRecords(
          Array.isArray(data.records)
            ? data.records
            : []
        );
      } else {
        console.error(
          data.message || "Failed to fetch medical records"
        );
      }
    } catch (error) {
      console.error(
        "Medical records fetch error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // =====================================================
  // DOCTOR LIST FOR FILTER
  // =====================================================

  const doctors = useMemo(() => {
    const doctorMap = new Map();

    records.forEach((record) => {
      if (record.doctor_id) {
        const id = String(record.doctor_id);

        if (!doctorMap.has(id)) {
          doctorMap.set(id, {
            id,
            name:
              record.doctor_name ||
              `Doctor #${record.doctor_id}`,
          });
        }
      }
    });

    return Array.from(doctorMap.values()).sort(
      (a, b) => a.name.localeCompare(b.name)
    );
  }, [records]);

  // =====================================================
  // FILTER + SEARCH + SORT
  // =====================================================

  const filteredRecords = useMemo(() => {
    let result = [...records];

    const search = searchTerm
      .trim()
      .toLowerCase();

    // SEARCH
    if (search) {
      result = result.filter((record) => {
        const patientName =
          record.patient_name || "";

        const doctorName =
          record.doctor_name || "";

        const diagnosis =
          record.diagnosis || "";

        const symptoms =
          record.symptoms || "";

        const treatment =
          record.treatment || "";

        const notes =
          record.notes || "";

        const patientId =
          record.patient_id || "";

        const doctorId =
          record.doctor_id || "";

        const appointmentId =
          record.appointment_id || "";

        return (
          String(patientName)
            .toLowerCase()
            .includes(search) ||
          String(doctorName)
            .toLowerCase()
            .includes(search) ||
          String(diagnosis)
            .toLowerCase()
            .includes(search) ||
          String(symptoms)
            .toLowerCase()
            .includes(search) ||
          String(treatment)
            .toLowerCase()
            .includes(search) ||
          String(notes)
            .toLowerCase()
            .includes(search) ||
          String(patientId)
            .toLowerCase()
            .includes(search) ||
          String(doctorId)
            .toLowerCase()
            .includes(search) ||
          String(appointmentId)
            .toLowerCase()
            .includes(search)
        );
      });
    }

    // DOCTOR FILTER
    if (doctorFilter) {
      result = result.filter(
        (record) =>
          String(record.doctor_id) ===
          String(doctorFilter)
      );
    }

    // DATE FILTER
    if (dateFilter) {
      result = result.filter((record) => {
        if (!record.record_date) return false;

        return (
          String(record.record_date).slice(0, 10) ===
          dateFilter
        );
      });
    }

    // SORT
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.record_date || 0) -
          new Date(a.record_date || 0)
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.record_date || 0) -
          new Date(b.record_date || 0)
        );
      }

      if (sortBy === "patient-az") {
        return String(
          a.patient_name ||
            `Patient #${a.patient_id}` ||
            ""
        ).localeCompare(
          String(
            b.patient_name ||
              `Patient #${b.patient_id}` ||
              ""
          )
        );
      }

      if (sortBy === "patient-za") {
        return String(
          b.patient_name ||
            `Patient #${b.patient_id}` ||
            ""
        ).localeCompare(
          String(
            a.patient_name ||
              `Patient #${a.patient_id}` ||
              ""
          )
        );
      }

      if (sortBy === "doctor-az") {
        return String(
          a.doctor_name ||
            `Doctor #${a.doctor_id}` ||
            ""
        ).localeCompare(
          String(
            b.doctor_name ||
              `Doctor #${b.doctor_id}` ||
              ""
          )
        );
      }

      return 0;
    });

    return result;
  }, [
    records,
    searchTerm,
    doctorFilter,
    dateFilter,
    sortBy,
  ]);

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = () => {
    setSearchTerm("");
    setDoctorFilter("");
    setDateFilter("");
    setSortBy("newest");
  };

  const filtersApplied =
    searchTerm ||
    doctorFilter ||
    dateFilter ||
    sortBy !== "newest";

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (record) => {
    setEditingRecord(record);

    setEditForm({
      patient_id: record.patient_id || "",
      doctor_id: record.doctor_id || "",
      appointment_id:
        record.appointment_id || "",
      diagnosis: record.diagnosis || "",
      symptoms: record.symptoms || "",
      treatment: record.treatment || "",
      notes: record.notes || "",
      record_date: record.record_date
        ? String(record.record_date).slice(0, 10)
        : "",
    });
  };

  // =====================================================
  // HANDLE EDIT INPUT
  // =====================================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE EDIT
  // =====================================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (
      !editForm.diagnosis.trim() ||
      !editForm.record_date
    ) {
      alert(
        "Diagnosis and Record Date are required."
      );
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/${editingRecord.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            patient_id: Number(
              editForm.patient_id
            ),
            doctor_id: Number(
              editForm.doctor_id
            ),
            appointment_id:
              editForm.appointment_id
                ? Number(
                    editForm.appointment_id
                  )
                : null,
            diagnosis:
              editForm.diagnosis.trim(),
            symptoms:
              editForm.symptoms.trim(),
            treatment:
              editForm.treatment.trim(),
            notes:
              editForm.notes.trim(),
            record_date:
              editForm.record_date,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert(
          "Medical record updated successfully!"
        );

        setEditingRecord(null);
        await fetchRecords();
      } else {
        alert(
          data.message ||
            "Failed to update medical record."
        );
      }
    } catch (error) {
      console.error(
        "Update medical record error:",
        error
      );

      alert(
        "Unable to connect to server."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id) => {
    if (!canDelete) {
      alert(
        "Only admin can delete medical records."
      );
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this medical record?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert(
          "Medical record deleted successfully!"
        );

        await fetchRecords();
      } else {
        alert(
          data.message ||
            "Failed to delete medical record."
        );
      }
    } catch (error) {
      console.error(
        "Delete medical record error:",
        error
      );

      alert(
        "Unable to connect to server."
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
          color: "#64748b",
        }}
      >
        <div
          style={{
            fontSize: "40px",
            marginBottom: "10px",
          }}
        >
          📋
        </div>

        <h3>Loading Medical Records...</h3>
      </div>
    );
  }

  // =====================================================
  // EDIT SCREEN
  // =====================================================

  if (editingRecord) {
    return (
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "16px",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              Edit Medical Record
            </h2>

            <p
              style={{
                color: "#64748b",
                marginTop: "6px",
              }}
            >
              Update medical record information
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setEditingRecord(null)
            }
            style={{
              border: "none",
              background: "#f1f5f9",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleUpdate}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, 1fr)",
              gap: "20px",
            }}
          >
            <div>
              <label>Patient ID</label>

              <input
                type="number"
                name="patient_id"
                value={editForm.patient_id}
                disabled={isDoctor}
                onChange={handleEditChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Doctor ID</label>

              <input
                type="number"
                name="doctor_id"
                value={editForm.doctor_id}
                disabled={isDoctor}
                onChange={handleEditChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Appointment ID</label>

              <input
                type="number"
                name="appointment_id"
                value={
                  editForm.appointment_id
                }
                onChange={handleEditChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Record Date</label>

              <input
                type="date"
                name="record_date"
                value={
                  editForm.record_date
                }
                onChange={handleEditChange}
                required
                style={inputStyle}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label>Diagnosis</label>

              <input
                type="text"
                name="diagnosis"
                value={
                  editForm.diagnosis
                }
                onChange={handleEditChange}
                required
                style={inputStyle}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label>Symptoms</label>

              <textarea
                name="symptoms"
                value={
                  editForm.symptoms
                }
                onChange={handleEditChange}
                rows="4"
                style={textareaStyle}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label>Treatment</label>

              <textarea
                name="treatment"
                value={
                  editForm.treatment
                }
                onChange={handleEditChange}
                rows="4"
                style={textareaStyle}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label>Notes</label>

              <textarea
                name="notes"
                value={editForm.notes}
                onChange={handleEditChange}
                rows="4"
                style={textareaStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "25px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setEditingRecord(null)
              }
              style={cancelButton}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={saveButton}
            >
              {saving
                ? "Saving..."
                : "✓ Update Record"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =====================================================
  // MAIN LIST PAGE
  // =====================================================

  return (
    <div>
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
            }}
          >
            Medical Records
          </h1>

          <p
            style={{
              color: "#64748b",
              marginTop: "6px",
            }}
          >
            Patient medical history and records
          </p>
        </div>

        {canAdd && (
          <button
            onClick={onAddRecord}
            style={addButton}
          >
            + Add Medical Record
          </button>
        )}
      </div>

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div style={statCard}>
          <div style={statIcon}>📋</div>

          <div>
            <span style={statLabel}>
              Total Records
            </span>

            <strong style={statNumber}>
              {records.length}
            </strong>
          </div>
        </div>

        <div style={statCard}>
          <div style={statIcon}>🔎</div>

          <div>
            <span style={statLabel}>
              Showing
            </span>

            <strong style={statNumber}>
              {filteredRecords.length}
            </strong>
          </div>
        </div>

        <div style={statCard}>
          <div style={statIcon}>👨‍⚕️</div>

          <div>
            <span style={statLabel}>
              Doctors
            </span>

            <strong style={statNumber}>
              {doctors.length}
            </strong>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTER PANEL
      ================================================= */}

      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.05)",
          border: "1px solid #eef2f7",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            marginBottom: "18px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "17px",
                color: "#1e293b",
              }}
            >
              🔍 Search & Filter Records
            </h3>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              Search patient, doctor, diagnosis,
              symptoms, treatment or notes
            </p>
          </div>

          {filtersApplied && (
            <button
              type="button"
              onClick={resetFilters}
              style={resetButton}
            >
              ↻ Reset Filters
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >
          {/* SEARCH */}

          <div>
            <label style={filterLabel}>
              Search
            </label>

            <input
              type="text"
              placeholder="Patient, doctor, diagnosis..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              style={filterInput}
            />
          </div>

          {/* DOCTOR */}

          <div>
            <label style={filterLabel}>
              Doctor
            </label>

            <select
              value={doctorFilter}
              onChange={(e) =>
                setDoctorFilter(e.target.value)
              }
              style={filterInput}
            >
              <option value="">
                All Doctors
              </option>

              {doctors.map((doctor) => (
                <option
                  key={doctor.id}
                  value={doctor.id}
                >
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>

          {/* DATE */}

          <div>
            <label style={filterLabel}>
              Record Date
            </label>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
              style={filterInput}
            />
          </div>

          {/* SORT */}

          <div>
            <label style={filterLabel}>
              Sort By
            </label>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              style={filterInput}
            >
              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

              <option value="patient-az">
                Patient A-Z
              </option>

              <option value="patient-za">
                Patient Z-A
              </option>

              <option value="doctor-az">
                Doctor A-Z
              </option>
            </select>
          </div>
        </div>

        {/* RESULT INFO */}

        <div
          style={{
            marginTop: "18px",
            paddingTop: "15px",
            borderTop:
              "1px solid #eef2f7",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Showing{" "}
            <strong
              style={{
                color: "#2563eb",
              }}
            >
              {filteredRecords.length}
            </strong>{" "}
            of{" "}
            <strong>
              {records.length}
            </strong>{" "}
            medical records
          </span>

          {filtersApplied && (
            <span
              style={{
                background: "#eff6ff",
                color: "#2563eb",
                padding: "5px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              Filters Applied
            </span>
          )}
        </div>
      </div>

      {/* =================================================
          NO RECORDS AT ALL
      ================================================= */}

      {records.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "70px 30px",
            textAlign: "center",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              fontSize: "55px",
              marginBottom: "15px",
            }}
          >
            📋
          </div>

          <h2>
            No Medical Records Found
          </h2>

          <p
            style={{
              color: "#64748b",
            }}
          >
            No medical records are available.
          </p>

          {canAdd && (
            <button
              onClick={onAddRecord}
              style={addButton}
            >
              + Add Medical Record
            </button>
          )}
        </div>
      ) : filteredRecords.length === 0 ? (

        /* =================================================
           FILTER NO RESULT
        ================================================= */

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "60px 30px",
            textAlign: "center",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              fontSize: "50px",
              marginBottom: "12px",
            }}
          >
            🔍
          </div>

          <h2>
            No Matching Records
          </h2>

          <p
            style={{
              color: "#64748b",
              marginBottom: "20px",
            }}
          >
            No medical records match your
            current search or filters.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            style={resetButtonLarge}
          >
            ↻ Clear Filters
          </button>
        </div>

      ) : (

        /* =================================================
           TABLE
        ================================================= */

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1100px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                  }}
                >
                  <th style={thStyle}>
                    ID
                  </th>

                  <th style={thStyle}>
                    Patient
                  </th>

                  <th style={thStyle}>
                    Doctor
                  </th>

                  <th style={thStyle}>
                    Diagnosis
                  </th>

                  <th style={thStyle}>
                    Symptoms
                  </th>

                  <th style={thStyle}>
                    Treatment
                  </th>

                  <th style={thStyle}>
                    Date
                  </th>

                  {canEdit && (
                    <th style={thStyle}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td style={tdStyle}>
                      #{record.id}
                    </td>

                    <td style={tdStyle}>
                      <strong>
                        {record.patient_name ||
                          `Patient #${record.patient_id}`}
                      </strong>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#94a3b8",
                          marginTop: "3px",
                        }}
                      >
                        ID: {record.patient_id}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <strong>
                        {record.doctor_name ||
                          `Doctor #${record.doctor_id}`}
                      </strong>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "3px",
                        }}
                      >
                        {record.department ||
                          "Medical"}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <strong>
                        {record.diagnosis ||
                          "-"}
                      </strong>
                    </td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "block",
                          maxWidth: "220px",
                          whiteSpace:
                            "pre-wrap",
                          color: "#475569",
                          lineHeight: "1.5",
                        }}
                      >
                        {record.symptoms ||
                          "-"}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "block",
                          maxWidth: "220px",
                          whiteSpace:
                            "pre-wrap",
                          color: "#475569",
                          lineHeight: "1.5",
                        }}
                      >
                        {record.treatment ||
                          "-"}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          background: "#f0fdf4",
                          color: "#166534",
                          padding: "5px 9px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {record.record_date
                          ? String(
                              record.record_date
                            ).slice(0, 10)
                          : "-"}
                      </span>
                    </td>

                    {canEdit && (
                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(record)
                            }
                            style={editButton}
                          >
                            ✏️ Edit
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  record.id
                                )
                              }
                              style={deleteButton}
                            >
                              🗑 Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================
          PATIENT VIEW ONLY
      ================================================= */}

      {role === "patient" && (
        <div
          style={{
            marginTop: "15px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          🔒 You have view-only access to medical
          records.
        </div>
      )}
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  marginTop: "7px",
  border: "1px solid #dbe3ee",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  padding: "12px 14px",
  marginTop: "7px",
  border: "1px solid #dbe3ee",
  borderRadius: "8px",
  fontSize: "14px",
  resize: "vertical",
  boxSizing: "border-box",
};

const filterLabel = {
  display: "block",
  fontSize: "12px",
  fontWeight: "700",
  color: "#475569",
  marginBottom: "7px",
};

const filterInput = {
  width: "100%",
  padding: "11px 13px",
  border: "1px solid #dbe3ee",
  borderRadius: "9px",
  fontSize: "13px",
  color: "#334155",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const thStyle = {
  textAlign: "left",
  padding: "15px 14px",
  fontSize: "13px",
  color: "#475569",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "16px 14px",
  borderBottom: "1px solid #eef2f7",
  fontSize: "14px",
  verticalAlign: "top",
};

const addButton = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
};

const resetButton = {
  background: "#f1f5f9",
  color: "#475569",
  border: "1px solid #dbe3ee",
  padding: "9px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px",
};

const resetButtonLarge = {
  background: "#eff6ff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  padding: "11px 18px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: "700",
};

const statCard = {
  background: "#fff",
  borderRadius: "14px",
  padding: "18px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  boxShadow:
    "0 4px 20px rgba(0,0,0,0.05)",
  border: "1px solid #eef2f7",
};

const statIcon = {
  width: "45px",
  height: "45px",
  borderRadius: "12px",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
};

const statLabel = {
  display: "block",
  color: "#64748b",
  fontSize: "12px",
  marginBottom: "4px",
};

const statNumber = {
  display: "block",
  color: "#1e293b",
  fontSize: "22px",
};

const editButton = {
  background: "#eff6ff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  padding: "8px 11px",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "600",
};

const deleteButton = {
  background: "#fef2f2",
  color: "#dc2626",
  border: "1px solid #fecaca",
  padding: "8px 11px",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "600",
};

const cancelButton = {
  background: "#f1f5f9",
  color: "#475569",
  border: "none",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const saveButton = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "11px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
};

export default MedicalRecordList;