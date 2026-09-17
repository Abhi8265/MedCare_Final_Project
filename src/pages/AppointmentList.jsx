import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

function AppointmentList({ onAddAppointment }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // =====================================================
  // GET LOGGED-IN USER
  // =====================================================

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAdmin = user.role === "admin";
  const isPatient = user.role === "patient";
  const isDoctor = user.role === "doctor";

  // =====================================================
  // PERMISSIONS
  // =====================================================

  // Admin + Patient can book
  const canBookAppointment =
    isAdmin || isPatient;

  // Only Admin can delete
  const canDeleteAppointment = isAdmin;

  // Admin + Doctor can update status
  const canUpdateStatus =
    isAdmin || isDoctor;

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // FETCH APPOINTMENTS
  // =====================================================

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        setMessage("❌ Please login again.");
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

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setMessage(
          "❌ Session expired. Please logout and login again."
        );
        return;
      }

      if (data.success) {
        setAppointments(
          data.appointments || []
        );
        setMessage("");
      } else {
        setMessage(
          data.message ||
            "❌ Failed to load appointments"
        );
      }
    } catch (error) {
      console.error(
        "Appointments error:",
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
    fetchAppointments();
  }, []);

  // =====================================================
  // FILTER + SORT APPOINTMENTS
  // =====================================================

  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    const searchValue =
      search.trim().toLowerCase();

    // ---------------------------------------------------
    // SEARCH
    // ---------------------------------------------------

    if (searchValue) {
      result = result.filter(
        (appointment) => {
          const patientName =
            String(
              appointment.patient_name || ""
            ).toLowerCase();

          const doctorName =
            String(
              appointment.doctor_name || ""
            ).toLowerCase();

          const department =
            String(
              appointment.department || ""
            ).toLowerCase();

          const reason =
            String(
              appointment.reason || ""
            ).toLowerCase();

          const status =
            String(
              appointment.status || ""
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
            reason.includes(
              searchValue
            ) ||
            status.includes(
              searchValue
            )
          );
        }
      );
    }

    // ---------------------------------------------------
    // STATUS FILTER
    // ---------------------------------------------------

    if (statusFilter !== "all") {
      result = result.filter(
        (appointment) =>
          String(
            appointment.status ||
              "confirmed"
          ).toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    // ---------------------------------------------------
    // DATE FILTER
    // ---------------------------------------------------

    if (dateFilter) {
      result = result.filter(
        (appointment) => {
          if (
            !appointment.appointment_date
          ) {
            return false;
          }

          const appointmentDate =
            new Date(
              appointment.appointment_date
            );

          if (
            Number.isNaN(
              appointmentDate.getTime()
            )
          ) {
            return false;
          }

          const year =
            appointmentDate.getFullYear();

          const month = String(
            appointmentDate.getMonth() + 1
          ).padStart(2, "0");

          const day = String(
            appointmentDate.getDate()
          ).padStart(2, "0");

          const formattedDate =
            `${year}-${month}-${day}`;

          return (
            formattedDate === dateFilter
          );
        }
      );
    }

    // ---------------------------------------------------
    // SORT
    // ---------------------------------------------------

    if (sortBy === "newest") {
      result.sort((a, b) => {
        const dateA = new Date(
          `${a.appointment_date || ""} ${
            a.appointment_time || ""
          }`
        );

        const dateB = new Date(
          `${b.appointment_date || ""} ${
            b.appointment_time || ""
          }`
        );

        return dateB - dateA;
      });
    }

    if (sortBy === "oldest") {
      result.sort((a, b) => {
        const dateA = new Date(
          `${a.appointment_date || ""} ${
            a.appointment_time || ""
          }`
        );

        const dateB = new Date(
          `${b.appointment_date || ""} ${
            b.appointment_time || ""
          }`
        );

        return dateA - dateB;
      });
    }

    if (sortBy === "patient-asc") {
      result.sort((a, b) =>
        String(
          a.patient_name || ""
        ).localeCompare(
          String(
            b.patient_name || ""
          )
        )
      );
    }

    if (sortBy === "patient-desc") {
      result.sort((a, b) =>
        String(
          b.patient_name || ""
        ).localeCompare(
          String(
            a.patient_name || ""
          )
        )
      );
    }

    if (sortBy === "doctor-asc") {
      result.sort((a, b) =>
        String(
          a.doctor_name || ""
        ).localeCompare(
          String(
            b.doctor_name || ""
          )
        )
      );
    }

    if (sortBy === "doctor-desc") {
      result.sort((a, b) =>
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
    appointments,
    search,
    statusFilter,
    dateFilter,
    sortBy,
  ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("");
    setSortBy("newest");
  };

  const hasFilters =
    search.trim() ||
    statusFilter !== "all" ||
    dateFilter ||
    sortBy !== "newest";

  // =====================================================
  // UPDATE APPOINTMENT STATUS
  // =====================================================

  const handleStatusUpdate = async (
    id,
    status
  ) => {
    const statusText =
      status.charAt(0).toUpperCase() +
      status.slice(1);

    const confirmUpdate =
      window.confirm(
        `Are you sure you want to mark this appointment as "${statusText}"?`
      );

    if (!confirmUpdate) return;

    try {
      setUpdatingId(id);
      setMessage("");

      const token = getToken();

      if (!token) {
        setMessage(
          "❌ Please login again."
        );
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/appointments/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setMessage(
          "❌ You do not have permission to update this appointment."
        );
        return;
      }

      if (data.success) {
        setMessage(
          `✅ Appointment status updated to "${statusText}"`
        );

        await fetchAppointments();
      } else {
        setMessage(
          "❌ " +
            (data.message ||
              "Failed to update status")
        );
      }
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      setMessage(
        "❌ Server connection failed"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =====================================================
  // DELETE APPOINTMENT
  // =====================================================

  const handleDelete = async (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this appointment?"
      );

    if (!confirmDelete) return;

    try {
      setMessage("");

      const token = getToken();

      if (!token) {
        setMessage(
          "❌ Please login again."
        );
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/appointments/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setMessage(
          "❌ Only admin can delete appointments."
        );
        return;
      }

      if (data.success) {
        setMessage(
          "✅ Appointment deleted successfully"
        );

        await fetchAppointments();
      } else {
        setMessage(
          "❌ " +
            (data.message ||
              "Failed to delete appointment")
        );
      }
    } catch (error) {
      console.error(
        "Delete appointment error:",
        error
      );

      setMessage(
        "❌ Server connection failed"
      );
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (time) => {
    if (!time) return "—";

    const parts = String(time).split(":");

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return time;
    }

    const date = new Date();

    date.setHours(
      hours,
      minutes,
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // STATUS BUTTONS
  // =====================================================

  const renderStatusActions = (
    appointment
  ) => {
    if (!canUpdateStatus) return null;

    const currentStatus = (
      appointment.status ||
      "confirmed"
    ).toLowerCase();

    const isUpdating =
      updatingId === appointment.id;

    return (
      <div className="appointment-status-actions">

        {/* CONFIRM */}

        {currentStatus !==
          "confirmed" && (
          <button
            type="button"
            className="status-action-btn confirm-btn"
            disabled={isUpdating}
            onClick={() =>
              handleStatusUpdate(
                appointment.id,
                "confirmed"
              )
            }
          >
            {isUpdating
              ? "..."
              : "Confirm"}
          </button>
        )}

        {/* COMPLETED */}

        {currentStatus !==
          "completed" && (
          <button
            type="button"
            className="status-action-btn completed-btn"
            disabled={isUpdating}
            onClick={() =>
              handleStatusUpdate(
                appointment.id,
                "completed"
              )
            }
          >
            {isUpdating
              ? "..."
              : "Completed"}
          </button>
        )}

        {/* CANCELLED */}

        {currentStatus !==
          "cancelled" && (
          <button
            type="button"
            className="status-action-btn cancelled-btn"
            disabled={isUpdating}
            onClick={() =>
              handleStatusUpdate(
                appointment.id,
                "cancelled"
              )
            }
          >
            {isUpdating
              ? "..."
              : "Cancelled"}
          </button>
        )}

      </div>
    );
  };

  // =====================================================
  // RETURN UI
  // =====================================================

  return (
    <div className="appointments-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="appointments-header">

        <div>
          <h1>Appointments</h1>

          <p>
            {isDoctor
              ? "View and manage your assigned appointments"
              : isPatient
              ? "View and manage your appointments"
              : "Manage hospital appointments"}
          </p>
        </div>

        {/* BOOK APPOINTMENT */}

        {canBookAppointment && (
          <button
            className="add-doctor-btn"
            onClick={onAddAppointment}
          >
            + Book Appointment
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
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by patient, doctor, department, reason..."
              style={{
                width: "100%",
                padding:
                  "13px 15px 13px 45px",
                border:
                  "1px solid #d9e2ec",
                borderRadius: "10px",
                fontSize: "15px",
                outline: "none",
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
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background:
                  "#eef2f7",
                fontWeight: "600",
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
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(160px, 1fr))",
            gap: "12px",
            alignItems:
              "center",
          }}
        >

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            style={filterStyle}
          >
            <option value="all">
              🏷️ All Status
            </option>

            <option value="confirmed">
              Confirmed
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

          {/* DATE */}

          <input
            type="date"
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(
                e.target.value
              )
            }
            style={filterStyle}
          />

          {/* SORT */}

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
            style={filterStyle}
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
                filteredAppointments.length
              }
            </strong>{" "}
            of{" "}
            <strong>
              {appointments.length}
            </strong>
          </div>

        </div>

        {/* RESET */}

        {hasFilters && (
          <div
            style={{
              marginTop: "14px",
              display: "flex",
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

      <div className="appointment-stat-card">

        <div className="appointment-stat-icon">
          📅
        </div>

        <div>
          <span>
            {hasFilters
              ? "Filtered Appointments"
              : "Total Appointments"}
          </span>

          <strong>
            {
              filteredAppointments.length
            }

            {hasFilters &&
              ` / ${appointments.length}`}
          </strong>
        </div>

      </div>

      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (
        <div className="doctor-message">
          {message}
        </div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div className="loading-text">
          Loading appointments...
        </div>

      ) : filteredAppointments.length ===
        0 ? (

        /* =================================================
           EMPTY STATE
        ================================================= */

        <div className="empty-doctors">

          <div className="empty-icon">
            📅
          </div>

          <h2>
            {hasFilters
              ? "No Matching Appointments"
              : "No Appointments Found"}
          </h2>

          <p>
            {hasFilters
              ? "Try changing your search or filters."
              : isDoctor
              ? "No appointments are currently assigned to you."
              : isPatient
              ? "You do not have any appointments yet."
              : "There are no appointments in the hospital system yet."}
          </p>

          {/* CLEAR FILTERS */}

          {hasFilters && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="add-doctor-btn"
              style={{
                marginTop:
                  "12px",
              }}
            >
              Clear Filters
            </button>
          )}

          {/* BOOK */}

          {!hasFilters &&
            canBookAppointment && (
              <button
                className="add-doctor-btn"
                onClick={
                  onAddAppointment
                }
              >
                + Book Appointment
              </button>
            )}

        </div>

      ) : (

        /* =================================================
           TABLE
        ================================================= */

        <div className="appointment-table-container">

          <table className="appointment-table">

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
                  Date
                </th>

                <th>
                  Time
                </th>

                <th>
                  Reason
                </th>

                <th>
                  Status
                </th>

                {/* STATUS UPDATE */}

                {canUpdateStatus && (
                  <th>
                    Status Update
                  </th>
                )}

                {/* DELETE */}

                {canDeleteAppointment && (
                  <th>
                    Actions
                  </th>
                )}

              </tr>
            </thead>

            <tbody>

              {filteredAppointments.map(
                (appointment) => (

                  <tr
                    key={
                      appointment.id
                    }
                  >

                    {/* PATIENT */}

                    <td>

                      <div className="appointment-person">

                        <div className="appointment-avatar">
                          🧑‍🤝‍🧑
                        </div>

                        <strong>
                          {
                            appointment.patient_name ||
                            "Unknown Patient"
                          }
                        </strong>

                      </div>

                    </td>

                    {/* DOCTOR */}

                    <td>

                      <div className="appointment-person">

                        <div className="appointment-avatar doctor">
                          👨‍⚕️
                        </div>

                        <strong>
                          {
                            appointment.doctor_name ||
                            "Unknown Doctor"
                          }
                        </strong>

                      </div>

                    </td>

                    {/* DEPARTMENT */}

                    <td>
                      {
                        appointment.department ||
                        "—"
                      }
                    </td>

                    {/* DATE */}

                    <td>
                      {formatDate(
                        appointment.appointment_date
                      )}
                    </td>

                    {/* TIME */}

                    <td>
                      {formatTime(
                        appointment.appointment_time
                      )}
                    </td>

                    {/* REASON */}

                    <td>
                      {
                        appointment.reason ||
                        "General Consultation"
                      }
                    </td>

                    {/* STATUS */}

                    <td>

                      <span
                        className={`appointment-status ${
                          appointment.status ||
                          "confirmed"
                        }`}
                      >
                        {
                          appointment.status ||
                          "confirmed"
                        }
                      </span>

                    </td>

                    {/* STATUS UPDATE */}

                    {canUpdateStatus && (
                      <td>
                        {renderStatusActions(
                          appointment
                        )}
                      </td>
                    )}

                    {/* DELETE */}

                    {canDeleteAppointment && (
                      <td>

                        <button
                          type="button"
                          className="delete-doctor-btn"
                          onClick={() =>
                            handleDelete(
                              appointment.id
                            )
                          }
                        >
                          Delete
                        </button>

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

export default AppointmentList;