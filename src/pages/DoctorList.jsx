import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

function DoctorList({
  onAddDoctor,
  canAdd = false,
}) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDoctor, setEditingDoctor] =
    useState(null);
  const [message, setMessage] = useState("");

  // SEARCH + FILTER
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // FETCH DOCTORS
  // =====================================================

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = getToken();

      if (!token) {
        setMessage(
          "❌ Login session expired. Please login again."
        );
        setLoading(false);
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:5000/api/doctors",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setDoctors(data.doctors || []);
      } else {
        setMessage(
          "❌ " +
            (data.message ||
              "Failed to load doctors")
        );
      }
    } catch (error) {
      console.error(
        "Fetch doctors error:",
        error
      );

      setMessage(
        "❌ Server connection failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // =====================================================
  // UNIQUE DEPARTMENTS
  // =====================================================

  const departments = useMemo(() => {
    const list = doctors
      .map((doctor) =>
        String(
          doctor.department || ""
        ).trim()
      )
      .filter(Boolean);

    return [...new Set(list)].sort(
      (a, b) =>
        a.localeCompare(b)
    );
  }, [doctors]);

  // =====================================================
  // FILTER + SORT DOCTORS
  // =====================================================

  const filteredDoctors = useMemo(() => {
    let result = [...doctors];

    const searchValue =
      search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((doctor) => {
        const name =
          String(
            doctor.name || ""
          ).toLowerCase();

        const email =
          String(
            doctor.email || ""
          ).toLowerCase();

        const phone =
          String(
            doctor.phone || ""
          ).toLowerCase();

        const department =
          String(
            doctor.department || ""
          ).toLowerCase();

        const specialization =
          String(
            doctor.specialization || ""
          ).toLowerCase();

        const qualification =
          String(
            doctor.qualification || ""
          ).toLowerCase();

        return (
          name.includes(searchValue) ||
          email.includes(searchValue) ||
          phone.includes(searchValue) ||
          department.includes(searchValue) ||
          specialization.includes(
            searchValue
          ) ||
          qualification.includes(
            searchValue
          )
        );
      });
    }

    if (
      departmentFilter !== "all"
    ) {
      result = result.filter(
        (doctor) =>
          String(
            doctor.department || ""
          ).toLowerCase() ===
          departmentFilter.toLowerCase()
      );
    }

    if (sortBy === "name-asc") {
      result.sort((a, b) =>
        String(
          a.name || ""
        ).localeCompare(
          String(b.name || "")
        )
      );
    }

    if (sortBy === "name-desc") {
      result.sort((a, b) =>
        String(
          b.name || ""
        ).localeCompare(
          String(a.name || "")
        )
      );
    }

    if (sortBy === "experience-high") {
      result.sort(
        (a, b) =>
          Number(
            b.experience_years || 0
          ) -
          Number(
            a.experience_years || 0
          )
      );
    }

    if (sortBy === "fee-low") {
      result.sort(
        (a, b) =>
          Number(
            a.consultation_fee || 0
          ) -
          Number(
            b.consultation_fee || 0
          )
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(
            b.created_at || 0
          ) -
          new Date(
            a.created_at || 0
          )
      );
    }

    if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(
            a.created_at || 0
          ) -
          new Date(
            b.created_at || 0
          )
      );
    }

    return result;
  }, [
    doctors,
    search,
    departmentFilter,
    sortBy,
  ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("all");
    setSortBy("newest");
  };

  const hasFilters =
    search.trim() ||
    departmentFilter !== "all" ||
    sortBy !== "newest";

  // =====================================================
  // DELETE DOCTOR - ADMIN ONLY
  // =====================================================

  const handleDelete = async (id) => {
    if (!canAdd) {
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this doctor?"
    );

    if (!confirmDelete) return;

    try {
      const token = getToken();

      if (!token) {
        setMessage(
          "❌ Login session expired. Please login again."
        );
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/doctors/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(
          "✅ Doctor deleted successfully"
        );

        fetchDoctors();
      } else {
        setMessage(
          "❌ " +
            (data.message ||
              "Failed to delete doctor")
        );
      }
    } catch (error) {
      console.error(
        "Delete doctor error:",
        error
      );

      setMessage(
        "❌ Server connection failed"
      );
    }
  };

  // =====================================================
  // EDIT CHANGE
  // =====================================================

  const handleEditChange = (e) => {
    setEditingDoctor({
      ...editingDoctor,
      [e.target.name]:
        e.target.value,
    });
  };

  // =====================================================
  // UPDATE DOCTOR - ADMIN ONLY
  // =====================================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!canAdd) {
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        setMessage(
          "❌ Login session expired. Please login again."
        );
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/doctors/${editingDoctor.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            editingDoctor
          ),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(
          "✅ Doctor updated successfully"
        );

        setEditingDoctor(null);

        fetchDoctors();
      } else {
        setMessage(
          "❌ " +
            (data.message ||
              "Failed to update doctor")
        );
      }
    } catch (error) {
      console.error(
        "Update doctor error:",
        error
      );

      setMessage(
        "❌ Server connection failed"
      );
    }
  };

  // =====================================================
  // EDIT SCREEN
  // =====================================================

  if (editingDoctor && canAdd) {
    return (
      <div className="doctor-registration-page">
        <div className="doctor-registration-header">
          <div>
            <h1>Edit Doctor</h1>

            <p>
              Update doctor information
            </p>
          </div>

          <button
            className="add-doctor-btn"
            onClick={() =>
              setEditingDoctor(null)
            }
          >
            ← Back to Doctors
          </button>
        </div>

        <form
          className="doctor-form"
          onSubmit={handleUpdate}
        >
          <div className="doctor-form-section">
            <h2>Doctor Information</h2>

            <div className="doctor-form-grid">
              <div className="doctor-form-group">
                <label>
                  Doctor Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    editingDoctor.name ||
                    ""
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />
              </div>

              <div className="doctor-form-group">
                <label>Email *</label>

                <input
                  type="email"
                  name="email"
                  value={
                    editingDoctor.email ||
                    ""
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />
              </div>

              <div className="doctor-form-group">
                <label>Department</label>

                <input
                  type="text"
                  name="department"
                  value={
                    editingDoctor.department ||
                    ""
                  }
                  onChange={
                    handleEditChange
                  }
                />
              </div>

              <div className="doctor-form-group">
                <label>
                  Specialization
                </label>

                <input
                  type="text"
                  name="specialization"
                  value={
                    editingDoctor.specialization ||
                    ""
                  }
                  onChange={
                    handleEditChange
                  }
                />
              </div>

              <div className="doctor-form-group">
                <label>
                  Qualification
                </label>

                <input
                  type="text"
                  name="qualification"
                  value={
                    editingDoctor.qualification ||
                    ""
                  }
                  onChange={
                    handleEditChange
                  }
                />
              </div>

              <div className="doctor-form-group">
                <label>
                  Experience (Years)
                </label>

                <input
                  type="number"
                  name="experience_years"
                  value={
                    editingDoctor.experience_years ||
                    ""
                  }
                  onChange={
                    handleEditChange
                  }
                  min="0"
                />
              </div>

              <div className="doctor-form-group">
                <label>Phone</label>

                <input
                  type="text"
                  name="phone"
                  value={
                    editingDoctor.phone ||
                    ""
                  }
                  onChange={
                    handleEditChange
                  }
                />
              </div>

              <div className="doctor-form-group">
                <label>
                  Consultation Fee
                </label>

                <input
                  type="number"
                  name="consultation_fee"
                  value={
                    editingDoctor.consultation_fee ||
                    ""
                  }
                  onChange={
                    handleEditChange
                  }
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="doctor-form-actions">
            <button
              type="button"
              className="doctor-cancel-btn"
              onClick={() =>
                setEditingDoctor(null)
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="doctor-submit-btn"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =====================================================
  // DOCTORS LIST
  // =====================================================

  return (
    <div className="doctors-page">
      {/* HEADER */}

      <div className="doctors-header">
        <div>
          <h1>Doctors</h1>

          <p>
            {canAdd
              ? "Manage all registered doctors"
              : "View all registered doctors"}
          </p>
        </div>

        {canAdd && (
          <button
            className="add-doctor-btn"
            onClick={onAddDoctor}
          >
            + Add Doctor
          </button>
        )}
      </div>

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      <div
        style={{
          marginTop: "20px",
          marginBottom: "22px",
          padding: "18px",
          background: "#ffffff",
          border: "1px solid #e5eaf0",
          borderRadius: "14px",
          boxShadow:
            "0 4px 18px rgba(15, 23, 42, 0.04)",
        }}
      >
        {/* SEARCH */}

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
              placeholder="Search by doctor name, email, phone, department..."
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

        {/* FILTERS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(220px, 1fr)) 1fr auto",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {/* DEPARTMENT */}

          <select
            value={departmentFilter}
            onChange={(e) =>
              setDepartmentFilter(
                e.target.value
              )
            }
            style={filterStyle}
          >
            <option value="all">
              🏥 All Departments
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              )
            )}
          </select>

          {/* SORT */}

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

            <option value="experience-high">
              ⭐ Experience: High → Low
            </option>

            <option value="fee-low">
              ₹ Fee: Low → High
            </option>
          </select>

          {/* RESULT INFO */}

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "9px",
              background: "#f8fafc",
              color: "#475569",
              fontSize: "14px",
              textAlign: "center",
              border:
                "1px solid #e2e8f0",
              whiteSpace: "nowrap",
            }}
          >
            Showing{" "}
            <strong>
              {filteredDoctors.length}
            </strong>{" "}
            of{" "}
            <strong>
              {doctors.length}
            </strong>
          </div>

          {/* RESET */}

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

      {/* =================================================
          TOTAL DOCTORS
      ================================================= */}

      <div className="doctor-stat-card">
        <div className="doctor-stat-icon">
          👨‍⚕️
        </div>

        <div>
          <span>
            {hasFilters
              ? "Filtered Doctors"
              : "Total Doctors"}
          </span>

          <strong>
            {filteredDoctors.length}
            {hasFilters &&
              ` / ${doctors.length}`}
          </strong>
        </div>
      </div>

      {/* MESSAGE */}

      {message && (
        <div className="doctor-message">
          {message}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="loading-text">
          Loading doctors...
        </div>
      ) : filteredDoctors.length ===
        0 ? (
        /* EMPTY */

        <div className="empty-doctors">
          <div className="empty-icon">
            👨‍⚕️
          </div>

          <h2>
            {hasFilters
              ? "No Matching Doctors"
              : "No Doctors Found"}
          </h2>

          <p>
            {hasFilters
              ? "Try changing your search or filters."
              : canAdd
              ? "Add your first doctor to the hospital system."
              : "No doctors are currently registered."}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="add-doctor-btn"
              style={{
                marginTop: "12px",
              }}
            >
              Clear Filters
            </button>
          )}

          {!hasFilters && canAdd && (
            <button
              className="add-doctor-btn"
              onClick={onAddDoctor}
            >
              + Add Doctor
            </button>
          )}
        </div>
      ) : (
        /* =================================================
           TABLE
        ================================================= */

        <div className="doctor-table-container">
          <table className="doctor-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Department</th>
                <th>Specialization</th>
                <th>Qualification</th>
                <th>Experience</th>
                <th>Phone</th>
                <th>Fee</th>

                {canAdd && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredDoctors.map(
                (doctor) => (
                  <tr key={doctor.id}>
                    {/* DOCTOR */}

                    <td>
                      <div className="doctor-name-cell">
                        <div className="doctor-list-avatar">
                          👨‍⚕️
                        </div>

                        <div>
                          <strong>
                            {doctor.name}
                          </strong>

                          <small>
                            {doctor.email}
                          </small>
                        </div>
                      </div>
                    </td>

                    {/* DEPARTMENT */}

                    <td>
                      {doctor.department ||
                        "—"}
                    </td>

                    {/* SPECIALIZATION */}

                    <td>
                      {doctor.specialization ||
                        "—"}
                    </td>

                    {/* QUALIFICATION */}

                    <td>
                      {doctor.qualification ||
                        "—"}
                    </td>

                    {/* EXPERIENCE */}

                    <td>
                      <span
                        style={{
                          fontWeight: "600",
                        }}
                      >
                        {doctor.experience_years ||
                          0}{" "}
                        years
                      </span>
                    </td>

                    {/* PHONE */}

                    <td>
                      {doctor.phone || "—"}
                    </td>

                    {/* FEE */}

                    <td>
                      <span
                        style={{
                          fontWeight: "700",
                        }}
                      >
                        ₹
                        {doctor.consultation_fee ||
                          0}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    {canAdd && (
                      <td>
                        <div className="doctor-actions">
                          <button
                            className="edit-doctor-btn"
                            onClick={() =>
                              setEditingDoctor(
                                doctor
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-doctor-btn"
                            onClick={() =>
                              handleDelete(
                                doctor.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
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
  border: "1px solid #d9e2ec",
  borderRadius: "9px",
  background: "#fff",
  color: "#334155",
  fontSize: "14px",
  outline: "none",
  cursor: "pointer",
  boxSizing: "border-box",
};

export default DoctorList;