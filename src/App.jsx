import { useEffect, useState } from "react";
import "./App.css";
import "./AppointmentAnalytics.css";
import Login from "./pages/Login";

import PatientRegistration from "./pages/PatientRegistration";
import PatientList from "./pages/PatientList";

import MedicalRecordList from "./pages/MedicalRecordList";
import MedicalRecordRegistration from "./pages/MedicalRecordRegistration";

import PrescriptionList from "./pages/PrescriptionList";
import PrescriptionRegistration from "./pages/PrescriptionRegistration";

import DoctorList from "./pages/DoctorList";
import DoctorRegistration from "./pages/DoctorRegistration";

import AppointmentList from "./pages/AppointmentList";
import AppointmentRegistration from "./pages/AppointmentRegistration";

import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Announcement from "./pages/Announcement";

const API_URL = "https://medcarefinalproject-production.up.railway.app/api";

function App() {
  // =====================================================
  // STATE
  // =====================================================

  const [page, setPage] = useState("dashboard");

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [dashboardStats, setDashboardStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    revenue: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  const [todayAppointments, setTodayAppointments] = useState([]);

  const [appointmentsLoading, setAppointmentsLoading] =
    useState(true);

  const [departments, setDepartments] = useState([]);

  const [appointmentAnalytics, setAppointmentAnalytics] =
    useState({
      total: 0,
      completed: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
    });

  // =====================================================
  // USER
  // =====================================================

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch (error) {
    console.error("User data error:", error);
    user = null;
  }

  const profilePhoto = user?.id
    ? localStorage.getItem(`profilePhoto_${user.id}`)
    : null;

  // =====================================================
  // ROLE
  // =====================================================

  const role = user?.role;

  const isAdmin = role === "admin";
  const isDoctor = role === "doctor";
  const isPatient = role === "patient";

  // =====================================================
  // PERMISSIONS
  // =====================================================

  const canManageDoctors = isAdmin;

  const canViewDoctors =
    isAdmin || isDoctor || isPatient;

  const canManagePatients = isAdmin;

  const canViewPatients =
    isAdmin || isDoctor || isPatient;

  const canViewAppointments =
    isAdmin || isDoctor || isPatient;

  const canBookAppointments =
    isAdmin || isPatient;

  const canViewPrescriptions =
    isAdmin || isDoctor || isPatient;

  const canManagePrescriptions =
    isAdmin || isDoctor;

  const canViewMedicalRecords =
    isAdmin || isDoctor || isPatient;

  const canManageMedicalRecords =
    isAdmin || isDoctor;

  const canViewAnnouncements =
    isAdmin || isDoctor || isPatient;

  const canViewSettings =
    isAdmin || isDoctor || isPatient;

  const canViewProfile =
    isAdmin || isDoctor || isPatient;

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const fetchDashboardData = async () => {
      setStatsLoading(true);
      setAppointmentsLoading(true);

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setIsLoggedIn(false);
          return;
        }

        const response = await fetch(
          `${API_URL}/dashboard/stats`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // =================================================
        // SESSION EXPIRED
        // =================================================

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          setIsLoggedIn(false);
          setPage("dashboard");

          return;
        }

        const data = await response.json();

        if (response.ok && data.success) {
          // =================================================
          // STATS
          // =================================================

          setDashboardStats({
            patients: Number(data.stats?.patients || 0),
            doctors: Number(data.stats?.doctors || 0),
            appointments: Number(
              data.stats?.appointments || 0
            ),
            revenue: Number(
              data.stats?.revenue || 0
            ),
          });

          // =================================================
          // TODAY APPOINTMENTS
          // =================================================

          setTodayAppointments(
            Array.isArray(data.todayAppointments)
              ? data.todayAppointments
              : []
          );

          // =================================================
          // DEPARTMENTS
          // =================================================

          setDepartments(
            Array.isArray(data.departments)
              ? data.departments
              : []
          );

          // =================================================
          // APPOINTMENT ANALYTICS
          // =================================================

          setAppointmentAnalytics({
            total: Number(
              data.appointmentAnalytics?.total || 0
            ),
            completed: Number(
              data.appointmentAnalytics?.completed || 0
            ),
            confirmed: Number(
              data.appointmentAnalytics?.confirmed || 0
            ),
            pending: Number(
              data.appointmentAnalytics?.pending || 0
            ),
            cancelled: Number(
              data.appointmentAnalytics?.cancelled || 0
            ),
          });
        } else {
          console.error(
            "Dashboard API error:",
            data.message
          );
        }
      } catch (error) {
        console.error(
          "Dashboard data error:",
          error
        );
      } finally {
        setStatsLoading(false);
        setAppointmentsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isLoggedIn, page]);

  // =====================================================
  // SECURITY REDIRECT
  // =====================================================

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    // DOCTORS
    if (
      page === "doctor-registration" &&
      !canManageDoctors
    ) {
      setPage("doctors");
      return;
    }

    if (
      page === "doctors" &&
      !canViewDoctors
    ) {
      setPage("dashboard");
      return;
    }

    // PATIENTS
    if (
      page === "patient-registration" &&
      !canManagePatients
    ) {
      setPage("patients");
      return;
    }

    if (
      page === "patients" &&
      !canViewPatients
    ) {
      setPage("dashboard");
      return;
    }

    // APPOINTMENTS
    if (
      page === "appointment-registration" &&
      !canBookAppointments
    ) {
      setPage("appointments");
      return;
    }

    if (
      page === "appointments" &&
      !canViewAppointments
    ) {
      setPage("dashboard");
      return;
    }

    // PRESCRIPTIONS
    if (
      page === "prescription-registration" &&
      !canManagePrescriptions
    ) {
      setPage("prescriptions");
      return;
    }

    if (
      page === "prescriptions" &&
      !canViewPrescriptions
    ) {
      setPage("dashboard");
      return;
    }

    // MEDICAL RECORDS
    if (
      page === "medical-record-registration" &&
      !canManageMedicalRecords
    ) {
      setPage("medical-records");
      return;
    }

    if (
      page === "medical-records" &&
      !canViewMedicalRecords
    ) {
      setPage("dashboard");
      return;
    }

    // ANNOUNCEMENTS
    if (
      page === "announcements" &&
      !canViewAnnouncements
    ) {
      setPage("dashboard");
      return;
    }

    // PROFILE
    if (
      page === "profile" &&
      !canViewProfile
    ) {
      setPage("dashboard");
      return;
    }

    // SETTINGS
    if (
      page === "settings" &&
      !canViewSettings
    ) {
      setPage("dashboard");
    }
  }, [
    isLoggedIn,
    page,
    canManageDoctors,
    canViewDoctors,
    canManagePatients,
    canViewPatients,
    canViewAppointments,
    canBookAppointments,
    canViewPrescriptions,
    canManagePrescriptions,
    canViewMedicalRecords,
    canManageMedicalRecords,
    canViewAnnouncements,
    canViewProfile,
    canViewSettings,
  ]);

  // =====================================================
  // LOGIN
  // =====================================================

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => {
          setIsLoggedIn(true);
          setPage("dashboard");
        }}
      />
    );
  }

  // =====================================================
  // ANNOUNCEMENTS
  // =====================================================

  if (
    page === "announcements" &&
    canViewAnnouncements
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>
        </div>

        <Announcement />
      </div>
    );
  }

  // =====================================================
  // PROFILE
  // =====================================================

  if (
    page === "profile" &&
    canViewProfile
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>
        </div>

        <Profile />
      </div>
    );
  }

  // =====================================================
  // SETTINGS
  // =====================================================

  if (
    page === "settings" &&
    canViewSettings
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>
        </div>

        <Settings />
      </div>
    );
  }

  // =====================================================
  // APPOINTMENT REGISTRATION
  // =====================================================

  if (
    page === "appointment-registration" &&
    canBookAppointments
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("appointments")
            }
          >
            ← Back to Appointments
          </button>
        </div>

        <AppointmentRegistration
          onBack={() =>
            setPage("appointments")
          }
        />
      </div>
    );
  }

  // =====================================================
  // APPOINTMENTS
  // =====================================================

  if (
    page === "appointments" &&
    canViewAppointments
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>
        </div>

        <AppointmentList
          onAddAppointment={() =>
            setPage(
              "appointment-registration"
            )
          }
        />
      </div>
    );
  }

  // =====================================================
  // PRESCRIPTION REGISTRATION
  // =====================================================

  if (
    page === "prescription-registration" &&
    canManagePrescriptions
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("prescriptions")
            }
          >
            ← Back to Prescriptions
          </button>
        </div>

        <PrescriptionRegistration
          onBack={() =>
            setPage("prescriptions")
          }
        />
      </div>
    );
  }

  // =====================================================
  // PRESCRIPTIONS
  // =====================================================

  if (
    page === "prescriptions" &&
    canViewPrescriptions
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>
        </div>

        <PrescriptionList
          onAddPrescription={() =>
            setPage(
              "prescription-registration"
            )
          }
          canAdd={canManagePrescriptions}
        />
      </div>
    );
  }

  // =====================================================
  // MEDICAL RECORD REGISTRATION
  // =====================================================

  if (
    page === "medical-record-registration" &&
    canManageMedicalRecords
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("medical-records")
            }
          >
            ← Back to Medical Records
          </button>
        </div>

        <MedicalRecordRegistration
          onBack={() =>
            setPage("medical-records")
          }
        />
      </div>
    );
  }

  // =====================================================
  // MEDICAL RECORDS
  // =====================================================

  if (
    page === "medical-records" &&
    canViewMedicalRecords
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>
        </div>

        <MedicalRecordList
          onAddRecord={() =>
            setPage(
              "medical-record-registration"
            )
          }
          canAdd={canManageMedicalRecords}
        />
      </div>
    );
  }

  // =====================================================
  // PATIENT REGISTRATION
  // =====================================================

  if (
    page === "patient-registration" &&
    canManagePatients
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("patients")
            }
          >
            ← Back to Patients
          </button>
        </div>

        <PatientRegistration
          onBack={() =>
            setPage("patients")
          }
        />
      </div>
    );
  }

  // =====================================================
  // PATIENTS
  // =====================================================

  if (
    page === "patients" &&
    canViewPatients
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>
        </div>

        <PatientList
          onAddPatient={() =>
            setPage(
              "patient-registration"
            )
          }
          canAdd={canManagePatients}
        />
      </div>
    );
  }

  // =====================================================
  // DOCTOR REGISTRATION
  // =====================================================

  if (
    page === "doctor-registration" &&
    canManageDoctors
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("doctors")
            }
          >
            ← Back to Doctors
          </button>
        </div>

        <DoctorRegistration
          onBack={() =>
            setPage("doctors")
          }
        />
      </div>
    );
  }

  // =====================================================
  // DOCTORS
  // =====================================================

  if (
    page === "doctors" &&
    canViewDoctors
  ) {
    return (
      <div className="patient-page">
        <div className="top-bar">
          <button
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>
        </div>

        <DoctorList
          onAddDoctor={() =>
            setPage(
              "doctor-registration"
            )
          }
          canAdd={canManageDoctors}
        />
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        {/* LOGO */}

        <div className="logo">
          <span>✚</span>

          <div>
            <h2>MedCare</h2>
            <p>Hospital System</p>
          </div>
        </div>

        {/* USER */}

        <div
          style={{
            padding: "15px 20px",
            margin: "10px 15px",
            background: "#1b2435",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              color: "white",
            }}
          >
            👤 {user?.name || "User"}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#aeb8c7",
              marginTop: "4px",
              textTransform: "capitalize",
            }}
          >
            {user?.role || "User"}
          </div>
        </div>

        {/* LOGOUT */}

        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            setIsLoggedIn(false);
            setPage("dashboard");
          }}
        >
          🚪 Logout
        </button>

        {/* NAVIGATION */}

        <nav>

          <a
            className={
              page === "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("dashboard")
            }
          >
            🏠 Dashboard
          </a>

          {canViewDoctors && (
            <a
              className={
                page === "doctors"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("doctors")
              }
            >
              👨‍⚕️ Doctors
            </a>
          )}

          {canViewPatients && (
            <a
              className={
                page === "patients"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("patients")
              }
            >
              🧑‍🤝‍🧑 Patients
            </a>
          )}

          {canViewAppointments && (
            <a
              className={
                page === "appointments"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("appointments")
              }
            >
              📅 Appointments
            </a>
          )}

          {canViewPrescriptions && (
            <a
              className={
                page === "prescriptions"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("prescriptions")
              }
            >
              💊 Prescriptions
            </a>
          )}

          {canViewMedicalRecords && (
            <a
              className={
                page === "medical-records"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("medical-records")
              }
            >
              📋 Medical Records
            </a>
          )}

          {canViewAnnouncements && (
            <a
              className={
                page === "announcements"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("announcements")
              }
            >
              📢 Announcements
            </a>
          )}

          {canViewProfile && (
            <a
              className={
                page === "profile"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("profile")
              }
            >
              👤 Profile
            </a>
          )}

          {canViewSettings && (
            <a
              className={
                page === "settings"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("settings")
              }
            >
              ⚙️ Settings
            </a>
          )}

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          <div className="admin-box">

            <div
              className="admin-avatar"
              style={{
                overflow: "hidden",
                padding: 0,
              }}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                (user?.name || "U")
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            <div>
              <strong>
                {user?.name || "User"}
              </strong>

              <p>
                {user?.role || "User"}
              </p>
            </div>

          </div>

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="main-content">

        {/* HEADER */}

        <header className="header">

          <div>

            <h1>
              {page === "announcements"
                ? "Announcements"
                : page === "medical-records"
                ? "Medical Records"
                : page === "prescriptions"
                ? "Prescriptions"
                : page === "appointments"
                ? "Appointments"
                : page === "patients"
                ? "Patients"
                : page === "doctors"
                ? "Doctors"
                : "Hospital Dashboard"}
            </h1>

            <p>
              Welcome back,{" "}
              {user?.name || "User"} 👋
            </p>

          </div>

          <div className="header-right">

            <button className="notification">
              🔔
              <span></span>
            </button>

            <div className="profile">

              <div
                className="profile-avatar"
                style={{
                  overflow: "hidden",
                  padding: 0,
                }}
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  (user?.name || "U")
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

              <div>

                <strong>
                  {user?.name || "User"}
                </strong>

                <p>
                  {user?.role || "User"}
                </p>

              </div>

            </div>

          </div>

        </header>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <section className="stats-grid">

          {/* PATIENTS */}

          <div className="stat-card">

            <div className="stat-icon blue">
              🧑‍🤝‍🧑
            </div>

            <div>

              <p>Total Patients</p>

              <h2>
                {statsLoading
                  ? "..."
                  : dashboardStats.patients}
              </h2>

              <span className="green-text">
                Live from database
              </span>

            </div>

          </div>

          {/* DOCTORS */}

          <div className="stat-card">

            <div className="stat-icon green">
              👨‍⚕️
            </div>

            <div>

              <p>Total Doctors</p>

              <h2>
                {statsLoading
                  ? "..."
                  : dashboardStats.doctors}
              </h2>

              <span className="green-text">
                Live from database
              </span>

            </div>

          </div>

          {/* APPOINTMENTS */}

          <div className="stat-card">

            <div className="stat-icon purple">
              📅
            </div>

            <div>

              <p>Appointments</p>

              <h2>
                {statsLoading
                  ? "..."
                  : dashboardStats.appointments}
              </h2>

              <span className="green-text">
                Live from database
              </span>

            </div>

          </div>

          {/* REVENUE */}

          <div className="stat-card">

            <div className="stat-icon orange">
              ₹
            </div>

            <div>

              <p>Revenue</p>

              <h2>
                {statsLoading
                  ? "..."
                  : `₹${Number(
                      dashboardStats.revenue
                    ).toLocaleString("en-IN")}`}
              </h2>

              <span className="green-text">
                Completed appointments
              </span>

            </div>

          </div>

        </section>

        {/* =================================================
            APPOINTMENT ANALYTICS
        ================================================= */}

        <section className="analytics-panel">
          <div className="analytics-header">
            <div>
              <h2>Appointment Analytics</h2>
              <p>Live appointment status overview</p>
            </div>

            <div className="analytics-total">
              <span>Total</span>
              <strong>
                {statsLoading
                  ? "..."
                  : appointmentAnalytics.total}
              </strong>
            </div>
          </div>

          <div className="analytics-grid">
            {/* COMPLETED */}
            <div className="analytics-card">
              <div className="analytics-card-top">
                <div className="analytics-icon analytics-completed">
                  ✓
                </div>
                <span className="analytics-label">
                  Completed
                </span>
              </div>

              <div className="analytics-number">
                {statsLoading
                  ? "..."
                  : appointmentAnalytics.completed}
              </div>

              <div className="analytics-progress">
                <div
                  className="analytics-progress-fill analytics-progress-completed"
                  style={{
                    width: `${
                      appointmentAnalytics.total > 0
                        ? Math.min(
                            100,
                            (appointmentAnalytics.completed /
                              appointmentAnalytics.total) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>

              <small>
                {appointmentAnalytics.total > 0
                  ? Math.round(
                      (appointmentAnalytics.completed /
                        appointmentAnalytics.total) *
                        100
                    )
                  : 0}
                % of appointments
              </small>
            </div>

            {/* CONFIRMED */}
            <div className="analytics-card">
              <div className="analytics-card-top">
                <div className="analytics-icon analytics-confirmed">
                  ✓
                </div>
                <span className="analytics-label">
                  Confirmed
                </span>
              </div>

              <div className="analytics-number">
                {statsLoading
                  ? "..."
                  : appointmentAnalytics.confirmed}
              </div>

              <div className="analytics-progress">
                <div
                  className="analytics-progress-fill analytics-progress-confirmed"
                  style={{
                    width: `${
                      appointmentAnalytics.total > 0
                        ? Math.min(
                            100,
                            (appointmentAnalytics.confirmed /
                              appointmentAnalytics.total) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>

              <small>
                {appointmentAnalytics.total > 0
                  ? Math.round(
                      (appointmentAnalytics.confirmed /
                        appointmentAnalytics.total) *
                        100
                    )
                  : 0}
                % of appointments
              </small>
            </div>

            {/* PENDING */}
            <div className="analytics-card">
              <div className="analytics-card-top">
                <div className="analytics-icon analytics-pending">
                  !
                </div>
                <span className="analytics-label">
                  Pending
                </span>
              </div>

              <div className="analytics-number">
                {statsLoading
                  ? "..."
                  : appointmentAnalytics.pending}
              </div>

              <div className="analytics-progress">
                <div
                  className="analytics-progress-fill analytics-progress-pending"
                  style={{
                    width: `${
                      appointmentAnalytics.total > 0
                        ? Math.min(
                            100,
                            (appointmentAnalytics.pending /
                              appointmentAnalytics.total) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>

              <small>
                {appointmentAnalytics.total > 0
                  ? Math.round(
                      (appointmentAnalytics.pending /
                        appointmentAnalytics.total) *
                        100
                    )
                  : 0}
                % of appointments
              </small>
            </div>

            {/* CANCELLED */}
            <div className="analytics-card">
              <div className="analytics-card-top">
                <div className="analytics-icon analytics-cancelled">
                  ×
                </div>
                <span className="analytics-label">
                  Cancelled
                </span>
              </div>

              <div className="analytics-number">
                {statsLoading
                  ? "..."
                  : appointmentAnalytics.cancelled}
              </div>

              <div className="analytics-progress">
                <div
                  className="analytics-progress-fill analytics-progress-cancelled"
                  style={{
                    width: `${
                      appointmentAnalytics.total > 0
                        ? Math.min(
                            100,
                            (appointmentAnalytics.cancelled /
                              appointmentAnalytics.total) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>

              <small>
                {appointmentAnalytics.total > 0
                  ? Math.round(
                      (appointmentAnalytics.cancelled /
                        appointmentAnalytics.total) *
                        100
                    )
                  : 0}
                % of appointments
              </small>
            </div>
          </div>
        </section>

        {/* =================================================
            DASHBOARD GRID
        ================================================= */}

        <section className="dashboard-grid">

          {/* TODAY'S APPOINTMENTS */}

          <div className="panel appointments-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Today's Appointments
                </h2>

                <p>
                  Today's appointments from database
                </p>

              </div>

              <button
                className="view-btn"
                onClick={() =>
                  setPage("appointments")
                }
              >
                View All
              </button>

            </div>

            {appointmentsLoading ? (

              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#777",
                }}
              >
                Loading today's appointments...
              </div>

            ) : todayAppointments.length === 0 ? (

              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#777",
                }}
              >

                <div
                  style={{
                    fontSize: "40px",
                    marginBottom: "10px",
                  }}
                >
                  📅
                </div>

                <h3>
                  No Appointments Today
                </h3>

                <p>
                  There are no appointments
                  scheduled for today.
                </p>

              </div>

            ) : (

              todayAppointments.map(
                (appointment) => (

                  <div
                    className="appointment"
                    key={appointment.id}
                  >

                    {/* DOCTOR */}

                    <div className="doctor-avatar">
                      👨‍⚕️
                    </div>

                    <div className="appointment-info">

                      <h3>
                        {appointment.doctor_name ||
                          "Doctor"}
                      </h3>

                      <p>
                        {appointment.department ||
                          appointment.specialization ||
                          "General"}
                      </p>

                      <span>
                        {appointment.appointment_time ||
                          "--"}
                      </span>

                    </div>

                    {/* PATIENT */}

                    <div className="patient-name">

                      <strong>
                        {appointment.patient_name ||
                          "Patient"}
                      </strong>

                      <p>
                        {appointment.reason ||
                          "Consultation"}
                      </p>

                    </div>

                    {/* STATUS */}

                    <span
                      className={`status ${
                        appointment.status ===
                        "confirmed"
                          ? "confirmed"
                          : appointment.status ===
                            "pending"
                          ? "pending"
                          : appointment.status ===
                            "cancelled"
                          ? "cancelled"
                          : appointment.status ===
                            "completed"
                          ? "confirmed"
                          : "pending"
                      }`}
                    >
                      {appointment.status
                        ? appointment.status
                            .charAt(0)
                            .toUpperCase() +
                          appointment.status.slice(1)
                        : "Pending"}
                    </span>

                  </div>

                )
              )

            )}

          </div>

          {/* DEPARTMENTS */}

          <div className="panel departments-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Departments
                </h2>

                <p>
                  Hospital departments
                </p>

              </div>

              {departments.length > 0 && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  {departments.length} Departments
                </span>
              )}

            </div>

            {statsLoading ? (

              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "#777",
                }}
              >
                Loading departments...
              </div>

            ) : departments.length === 0 ? (

              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "#777",
                }}
              >

                <div
                  style={{
                    fontSize: "38px",
                    marginBottom: "10px",
                  }}
                >
                  🏥
                </div>

                <h3>
                  No Departments
                </h3>

                <p>
                  Add doctors with departments
                  to display them here.
                </p>

              </div>

            ) : (

              departments.map(
                (department, index) => {

                  const departmentIcons = [
                    "❤️",
                    "🧠",
                    "🦴",
                    "🩺",
                    "👁️",
                    "🫁",
                    "👶",
                    "🦷",
                  ];

                  return (
                    <div
                      className="department"
                      key={
                        department.department ||
                        index
                      }
                    >

                      <div className="department-icon">
                        {
                          departmentIcons[
                            index %
                              departmentIcons.length
                          ]
                        }
                      </div>

                      <div>

                        <strong>
                          {department.department}
                        </strong>

                        <p>
                          {department.doctor_count}{" "}
                          {Number(
                            department.doctor_count
                          ) === 1
                            ? "Doctor"
                            : "Doctors"}
                        </p>

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;