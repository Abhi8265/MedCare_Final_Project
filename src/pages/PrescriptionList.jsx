import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

function PrescriptionList({
  onAddPrescription,
  canAdd = false,
}) {
  const [prescriptions, setPrescriptions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [editingPrescription, setEditingPrescription] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  // =====================================================
  // SEARCH + FILTER STATES
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [doctorFilter, setDoctorFilter] =
    useState("all");

  const [dateFilter, setDateFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("newest");

  // =====================================================
  // EDIT FORM
  // =====================================================

  const [editForm, setEditForm] =
    useState({
      patient_id: "",
      doctor_id: "",
      appointment_id: "",
      diagnosis: "",
      medicines: "",
      instructions: "",
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

  // =====================================================
  // PERMISSIONS
  // =====================================================

  const canCreate =
    isAdmin || isDoctor;

  const canEdit =
    isAdmin || isDoctor;

  const canDelete =
    isAdmin;

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // FETCH PRESCRIPTIONS
  // =====================================================

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        alert("Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        "https://medcarefinalproject-production.up.railway.app/api/prescriptions",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      console.log(
        "Prescription API:",
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
        setPrescriptions(
          data.prescriptions || []
        );
      } else {
        alert(
          data.message ||
            "Failed to fetch prescriptions."
        );
      }
    } catch (error) {
      console.error(
        "Fetch prescriptions error:",
        error
      );

      alert(
        "Server connection failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "-";
    }

    return d.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // FORMAT DATE + TIME
  // =====================================================

  const formatDateTime = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "-";
    }

    return d.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // DATE ONLY FOR FILTER
  // =====================================================

  const getDateOnly = (date) => {
    if (!date) return "";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "";
    }

    const year =
      d.getFullYear();

    const month = String(
      d.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      d.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =====================================================
  // DOCTOR FILTER OPTIONS
  // =====================================================

  const doctorOptions = useMemo(() => {
    const doctors = prescriptions
      .map(
        (prescription) => ({
          id:
            prescription.doctor_id,
          name:
            prescription.doctor_name ||
            `Doctor #${prescription.doctor_id}`,
        })
      )
      .filter(
        (doctor) =>
          doctor.id !==
          undefined &&
          doctor.id !== null &&
          doctor.id !== ""
      );

    const uniqueDoctors = [];

    const seen = new Set();

    doctors.forEach((doctor) => {
      const key = String(
        doctor.id
      );

      if (!seen.has(key)) {
        seen.add(key);
        uniqueDoctors.push(
          doctor
        );
      }
    });

    return uniqueDoctors.sort(
      (a, b) =>
        String(a.name).localeCompare(
          String(b.name)
        )
    );
  }, [prescriptions]);

  // =====================================================
  // FILTER + SORT
  // =====================================================

  const filteredPrescriptions =
    useMemo(() => {
      let result = [
        ...prescriptions,
      ];

      const searchValue =
        search
          .trim()
          .toLowerCase();

      // -------------------------------------------------
      // SEARCH
      // -------------------------------------------------

      if (searchValue) {
        result = result.filter(
          (prescription) => {
            const patientName =
              String(
                prescription.patient_name ||
                  ""
              ).toLowerCase();

            const doctorName =
              String(
                prescription.doctor_name ||
                  ""
              ).toLowerCase();

            const department =
              String(
                prescription.department ||
                  ""
              ).toLowerCase();

            const diagnosis =
              String(
                prescription.diagnosis ||
                  ""
              ).toLowerCase();

            const medicines =
              String(
                prescription.medicines ||
                  ""
              ).toLowerCase();

            const instructions =
              String(
                prescription.instructions ||
                  ""
              ).toLowerCase();

            const patientId =
              String(
                prescription.patient_id ||
                  ""
              ).toLowerCase();

            const doctorId =
              String(
                prescription.doctor_id ||
                  ""
              ).toLowerCase();

            const appointmentId =
              String(
                prescription.appointment_id ||
                  ""
              ).toLowerCase();

            return (
              patientName.includes(
                searchValue
              ) ||
              doctorName.includes(
                searchValue
              ) ||
              department.includes(
                searchValue
              ) ||
              diagnosis.includes(
                searchValue
              ) ||
              medicines.includes(
                searchValue
              ) ||
              instructions.includes(
                searchValue
              ) ||
              patientId.includes(
                searchValue
              ) ||
              doctorId.includes(
                searchValue
              ) ||
              appointmentId.includes(
                searchValue
              )
            );
          }
        );
      }

      // -------------------------------------------------
      // DOCTOR FILTER
      // -------------------------------------------------

      if (doctorFilter !== "all") {
        result = result.filter(
          (prescription) =>
            String(
              prescription.doctor_id
            ) ===
            String(
              doctorFilter
            )
        );
      }

      // -------------------------------------------------
      // DATE FILTER
      // -------------------------------------------------

      if (dateFilter) {
        result = result.filter(
          (prescription) =>
            getDateOnly(
              prescription.created_at
            ) === dateFilter
        );
      }

      // -------------------------------------------------
      // SORT
      // -------------------------------------------------

      if (sortBy === "newest") {
        result.sort(
          (a, b) => {
            const dateA =
              new Date(
                a.created_at || 0
              );

            const dateB =
              new Date(
                b.created_at || 0
              );

            return dateB - dateA;
          }
        );
      }

      if (sortBy === "oldest") {
        result.sort(
          (a, b) => {
            const dateA =
              new Date(
                a.created_at || 0
              );

            const dateB =
              new Date(
                b.created_at || 0
              );

            return dateA - dateB;
          }
        );
      }

      if (
        sortBy === "patient-asc"
      ) {
        result.sort(
          (a, b) =>
            String(
              a.patient_name || ""
            ).localeCompare(
              String(
                b.patient_name || ""
              )
            )
        );
      }

      if (
        sortBy === "patient-desc"
      ) {
        result.sort(
          (a, b) =>
            String(
              b.patient_name || ""
            ).localeCompare(
              String(
                a.patient_name || ""
              )
            )
        );
      }

      if (
        sortBy === "doctor-asc"
      ) {
        result.sort(
          (a, b) =>
            String(
              a.doctor_name || ""
            ).localeCompare(
              String(
                b.doctor_name || ""
              )
            )
        );
      }

      if (
        sortBy === "doctor-desc"
      ) {
        result.sort(
          (a, b) =>
            String(
              b.doctor_name || ""
            ).localeCompare(
              String(
                a.doctor_name || ""
              )
            )
        );
      }

      return result;
    }, [
      prescriptions,
      search,
      doctorFilter,
      dateFilter,
      sortBy,
    ]);

  // =====================================================
  // HAS FILTERS
  // =====================================================

  const hasFilters =
    search.trim() !== "" ||
    doctorFilter !== "all" ||
    dateFilter !== "" ||
    sortBy !== "newest";

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setDoctorFilter("all");
    setDateFilter("");
    setSortBy("newest");
  };

  // =====================================================
  // START EDIT
  // =====================================================

  const handleEdit = (
    prescription
  ) => {
    setEditingPrescription(
      prescription
    );

    setEditForm({
      patient_id:
        prescription.patient_id ||
        "",
      doctor_id:
        prescription.doctor_id ||
        "",
      appointment_id:
        prescription.appointment_id ||
        "",
      diagnosis:
        prescription.diagnosis ||
        "",
      medicines:
        prescription.medicines ||
        "",
      instructions:
        prescription.instructions ||
        "",
    });
  };

  // =====================================================
  // EDIT CHANGE
  // =====================================================

  const handleEditChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setEditForm(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancelEdit = () => {
    setEditingPrescription(
      null
    );

    setEditForm({
      patient_id: "",
      doctor_id: "",
      appointment_id: "",
      diagnosis: "",
      medicines: "",
      instructions: "",
    });

    setSaving(false);
  };

  // =====================================================
  // UPDATE PRESCRIPTION
  // =====================================================

  const handleUpdate = async (
    e
  ) => {
    e.preventDefault();

    if (!editingPrescription) {
      return;
    }

    if (!editForm.patient_id) {
      alert(
        "Patient ID is required."
      );
      return;
    }

    if (!editForm.doctor_id) {
      alert(
        "Doctor ID is required."
      );
      return;
    }

    if (!editForm.appointment_id) {
      alert(
        "Appointment ID is required."
      );
      return;
    }

    if (
      !editForm.medicines.trim()
    ) {
      alert(
        "Medicines are required."
      );
      return;
    }

    setSaving(true);

    try {
      const token = getToken();

      if (!token) {
        alert(
          "Please login again."
        );
        return;
      }

      const prescriptionData = {
        appointment_id:
          Number(
            editForm.appointment_id
          ),
        patient_id:
          Number(
            editForm.patient_id
          ),
        doctor_id:
          Number(
            editForm.doctor_id
          ),
        diagnosis:
          editForm.diagnosis.trim() ||
          null,
        medicines:
          editForm.medicines.trim(),
        instructions:
          editForm.instructions.trim() ||
          null,
      };

      console.log(
        "Updating prescription:",
        prescriptionData
      );

      const response =
        await fetch(
          `https://medcarefinalproject-production.up.railway.app/api/prescriptions/${editingPrescription.id}`,
          {
            method: "PUT",
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

      const data =
        await response.json();

      console.log(
        "Update prescription response:",
        data
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        alert(
          data.message ||
            "You do not have permission."
        );
        return;
      }

      if (data.success) {
        alert(
          "Prescription updated successfully. ✅"
        );

        handleCancelEdit();

        await fetchPrescriptions();
      } else {
        alert(
          data.message ||
            "Failed to update prescription."
        );
      }
    } catch (error) {
      console.error(
        "Update prescription error:",
        error
      );

      alert(
        "Server connection failed."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE PRESCRIPTION
  // =====================================================

  const handleDelete = async (
    id
  ) => {
    if (!canDelete) {
      alert(
        "Only admin can delete prescriptions."
      );
      return;
    }

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this prescription?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        alert(
          "Please login again."
        );
        return;
      }

      const response =
        await fetch(
          `https://medcarefinalproject-production.up.railway.app/api/prescriptions/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      console.log(
        "Delete prescription response:",
        data
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        alert(
          data.message ||
            "You do not have permission."
        );
        return;
      }

      if (data.success) {
        alert(
          "Prescription deleted successfully. ✅"
        );

        await fetchPrescriptions();
      } else {
        alert(
          data.message ||
            "Failed to delete prescription."
        );
      }
    } catch (error) {
      console.error(
        "Delete prescription error:",
        error
      );

      alert(
        "Server connection failed."
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="patient-list-page">

        <div className="empty-patients">

          <p>
            Loading prescriptions...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // EDIT SCREEN
  // =====================================================

  if (editingPrescription) {
    return (
      <div className="patient-list-page">

        <div className="patient-list-header">

          <div>

            <h1>
              Edit Prescription
            </h1>

            <p>
              Update prescription details
            </p>

          </div>

        </div>

        <div
          style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "16px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >

          <form
            onSubmit={handleUpdate}
          >

            {/* PATIENT ID */}

            <div
              className="login-form-group"
              style={{
                marginBottom:
                  "20px",
              }}
            >

              <label>
                Patient ID
              </label>

              <input
                type="number"
                name="patient_id"
                value={
                  editForm.patient_id
                }
                onChange={
                  handleEditChange
                }
                disabled={isDoctor}
                required
              />

            </div>

            {/* DOCTOR ID */}

            <div
              className="login-form-group"
              style={{
                marginBottom:
                  "20px",
              }}
            >

              <label>
                Doctor ID
              </label>

              <input
                type="number"
                name="doctor_id"
                value={
                  editForm.doctor_id
                }
                onChange={
                  handleEditChange
                }
                disabled={isDoctor}
                required
              />

            </div>

            {/* APPOINTMENT ID */}

            <div
              className="login-form-group"
              style={{
                marginBottom:
                  "20px",
              }}
            >

              <label>
                Appointment ID
              </label>

              <input
                type="number"
                name="appointment_id"
                value={
                  editForm.appointment_id
                }
                onChange={
                  handleEditChange
                }
                required
              />

            </div>

            {/* DIAGNOSIS */}

            <div
              className="login-form-group"
              style={{
                marginBottom:
                  "20px",
              }}
            >

              <label>
                Diagnosis
              </label>

              <input
                type="text"
                name="diagnosis"
                placeholder="Enter diagnosis"
                value={
                  editForm.diagnosis
                }
                onChange={
                  handleEditChange
                }
              />

            </div>

            {/* MEDICINES */}

            <div
              className="login-form-group"
              style={{
                marginBottom:
                  "20px",
              }}
            >

              <label>
                Medicines *
              </label>

              <textarea
                name="medicines"
                placeholder="Enter medicines and dosage"
                value={
                  editForm.medicines
                }
                onChange={
                  handleEditChange
                }
                rows="5"
                required
              />

            </div>

            {/* INSTRUCTIONS */}

            <div
              className="login-form-group"
              style={{
                marginBottom:
                  "25px",
              }}
            >

              <label>
                Instructions
              </label>

              <textarea
                name="instructions"
                placeholder="Enter instructions"
                value={
                  editForm.instructions
                }
                onChange={
                  handleEditChange
                }
                rows="5"
              />

            </div>

            {/* BUTTONS */}

            <div
              style={{
                display:
                  "flex",
                gap: "12px",
                flexWrap:
                  "wrap",
              }}
            >

              <button
                type="submit"
                className="add-patient-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                type="button"
                className="delete-btn"
                onClick={
                  handleCancelEdit
                }
                disabled={saving}
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN SCREEN
  // =====================================================

  return (
    <div className="patient-list-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="patient-list-header">

        <div>

          <h1>
            Prescriptions
          </h1>

          <p>
            {isPatient
              ? "View your medical prescriptions"
              : "Manage hospital prescriptions"}
          </p>

        </div>

        {/* ADD */}

        {canCreate && (
          <button
            className="add-patient-btn"
            onClick={
              onAddPrescription
            }
          >
            + Add Prescription
          </button>
        )}

      </div>

      {/* =================================================
          SEARCH + FILTER PANEL
      ================================================= */}

      <div
        style={{
          marginTop: "20px",
          marginBottom: "22px",
          padding: "18px",
          background: "#ffffff",
          border:
            "1px solid #e5eaf0",
          borderRadius: "14px",
          boxShadow:
            "0 4px 18px rgba(15, 23, 42, 0.04)",
        }}
      >

        {/* SEARCH */}

        <div
          style={{
            display:
              "flex",
            gap: "12px",
            alignItems:
              "center",
            marginBottom:
              "16px",
          }}
        >

          <div
            style={{
              position:
                "relative",
              flex: 1,
            }}
          >

            <span
              style={{
                position:
                  "absolute",
                left: "15px",
                top: "50%",
                transform:
                  "translateY(-50%)",
                fontSize:
                  "18px",
              }}
            >
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by patient, doctor, diagnosis, medicines..."
              style={{
                width: "100%",
                padding:
                  "13px 15px 13px 45px",
                border:
                  "1px solid #d9e2ec",
                borderRadius:
                  "10px",
                fontSize:
                  "15px",
                outline:
                  "none",
                boxSizing:
                  "border-box",
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
                padding:
                  "12px 18px",
                border:
                  "none",
                borderRadius:
                  "8px",
                cursor:
                  "pointer",
                background:
                  "#eef2f7",
                fontWeight:
                  "600",
                whiteSpace:
                  "nowrap",
              }}
            >
              ✕ Clear Search
            </button>
          )}

        </div>

        {/* FILTER ROW */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(4, minmax(160px, 1fr))",
            gap: "12px",
            alignItems:
              "center",
          }}
        >

          {/* DOCTOR */}

          <select
            value={
              doctorFilter
            }
            onChange={(e) =>
              setDoctorFilter(
                e.target.value
              )
            }
            style={
              filterStyle
            }
          >

            <option value="all">
              👨‍⚕️ All Doctors
            </option>

            {doctorOptions.map(
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
                </option>
              )
            )}

          </select>

          {/* DATE */}

          <input
            type="date"
            value={
              dateFilter
            }
            onChange={(e) =>
              setDateFilter(
                e.target.value
              )
            }
            style={
              filterStyle
            }
          />

          {/* SORT */}

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
            style={
              filterStyle
            }
          >

            <option value="newest">
              ↕ Newest First
            </option>

            <option value="oldest">
              ↕ Oldest First
            </option>

            <option value="patient-asc">
              A → Z Patient
            </option>

            <option value="patient-desc">
              Z → A Patient
            </option>

            <option value="doctor-asc">
              A → Z Doctor
            </option>

            <option value="doctor-desc">
              Z → A Doctor
            </option>

          </select>

          {/* RESULT COUNT */}

          <div
            style={{
              padding:
                "12px 14px",
              borderRadius:
                "9px",
              background:
                "#f8fafc",
              color:
                "#475569",
              fontSize:
                "14px",
              textAlign:
                "center",
              border:
                "1px solid #e2e8f0",
              whiteSpace:
                "nowrap",
            }}
          >
            Showing{" "}
            <strong>
              {
                filteredPrescriptions.length
              }
            </strong>{" "}
            of{" "}
            <strong>
              {
                prescriptions.length
              }
            </strong>
          </div>

        </div>

        {/* RESET */}

        {hasFilters && (
          <div
            style={{
              marginTop:
                "14px",
              display:
                "flex",
              justifyContent:
                "flex-end",
            }}
          >

            <button
              type="button"
              onClick={
                clearFilters
              }
              style={{
                padding:
                  "11px 18px",
                border:
                  "1px solid #fecaca",
                borderRadius:
                  "9px",
                background:
                  "#fff5f5",
                color:
                  "#dc2626",
                cursor:
                  "pointer",
                fontWeight:
                  "700",
              }}
            >
              🔄 Reset Filters
            </button>

          </div>
        )}

      </div>

      {/* =================================================
          STAT CARD
      ================================================= */}

      <div className="patient-stat-card">

        <div className="patient-stat-icon">
          💊
        </div>

        <div>

          <p>
            {hasFilters
              ? "Filtered Prescriptions"
              : isPatient
              ? "My Prescriptions"
              : "Total Prescriptions"}
          </p>

          <h2>
            {
              filteredPrescriptions.length
            }

            {hasFilters &&
              ` / ${prescriptions.length}`}
          </h2>

        </div>

      </div>

      {/* =================================================
          NO DATA
      ================================================= */}

      {filteredPrescriptions.length ===
      0 ? (

        <div className="empty-patients">

          <div className="empty-icon">
            💊
          </div>

          <h2>
            {hasFilters
              ? "No Matching Prescriptions"
              : "No Prescriptions Found"}
          </h2>

          <p>
            {hasFilters
              ? "Try changing your search or filters."
              : canCreate
              ? "Add your first prescription to the hospital system."
              : "No prescriptions are available."}
          </p>

          {hasFilters && (
            <button
              type="button"
              className="add-patient-btn"
              onClick={
                clearFilters
              }
              style={{
                marginTop:
                  "12px",
              }}
            >
              Clear Filters
            </button>
          )}

          {!hasFilters &&
            canCreate && (
              <button
                className="add-patient-btn"
                onClick={
                  onAddPrescription
                }
              >
                + Add Prescription
              </button>
            )}

        </div>

      ) : (

        /* =================================================
           TABLE
        ================================================= */

        <div className="patients-table-container">

          <table className="patients-table">

            <thead>

              <tr>

                <th>
                  Patient
                </th>

                <th>
                  Doctor
                </th>

                <th>
                  Department
                </th>

                <th>
                  Diagnosis
                </th>

                <th>
                  Medicines
                </th>

                <th>
                  Instructions
                </th>

                <th>
                  Date
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredPrescriptions.map(
                (
                  prescription
                ) => (

                  <tr
                    key={
                      prescription.id
                    }
                  >

                    {/* PATIENT */}

                    <td>

                      <strong>
                        {
                          prescription.patient_name ||
                          `Patient #${prescription.patient_id}`
                        }
                      </strong>

                    </td>

                    {/* DOCTOR */}

                    <td>
                      {
                        prescription.doctor_name ||
                        `Doctor #${prescription.doctor_id}`
                      }
                    </td>

                    {/* DEPARTMENT */}

                    <td>

                      <span
                        style={{
                          background:
                            "#eef6ff",
                          padding:
                            "5px 10px",
                          borderRadius:
                            "20px",
                          fontSize:
                            "13px",
                        }}
                      >
                        {
                          prescription.department ||
                          "-"
                        }
                      </span>

                    </td>

                    {/* DIAGNOSIS */}

                    <td>
                      {
                        prescription.diagnosis ||
                        "-"
                      }
                    </td>

                    {/* MEDICINES */}

                    <td
                      style={{
                        maxWidth:
                          "240px",
                        whiteSpace:
                          "normal",
                        lineHeight:
                          "1.5",
                      }}
                    >
                      {
                        prescription.medicines ||
                        "-"
                      }
                    </td>

                    {/* INSTRUCTIONS */}

                    <td
                      style={{
                        maxWidth:
                          "240px",
                        whiteSpace:
                          "normal",
                        lineHeight:
                          "1.5",
                      }}
                    >
                      {
                        prescription.instructions ||
                        "-"
                      }
                    </td>

                    {/* DATE */}

                    <td>
                      {formatDateTime(
                        prescription.created_at
                      )}
                    </td>

                    {/* ACTIONS */}

                    <td>

                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            "8px",
                          flexWrap:
                            "wrap",
                        }}
                      >

                        {/* EDIT */}

                        {canEdit && (
                          <button
                            className="edit-btn"
                            onClick={() =>
                              handleEdit(
                                prescription
                              )
                            }
                          >
                            Edit
                          </button>
                        )}

                        {/* DELETE */}

                        {canDelete && (
                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(
                                prescription.id
                              )
                            }
                          >
                            Delete
                          </button>
                        )}

                        {/* PATIENT */}

                        {isPatient && (
                          <span
                            style={{
                              padding:
                                "6px 10px",
                              fontSize:
                                "13px",
                              color:
                                "#666",
                            }}
                          >
                            View Only
                          </span>
                        )}

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}

// =====================================================
// FILTER STYLE
// =====================================================

const filterStyle = {
  width: "100%",
  padding: "12px 13px",
  border:
    "1px solid #d9e2ec",
  borderRadius: "9px",
  background: "#fff",
  color: "#334155",
  fontSize: "14px",
  outline: "none",
  cursor: "pointer",
  boxSizing: "border-box",
};

export default PrescriptionList;