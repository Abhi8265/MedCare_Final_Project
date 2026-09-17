import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api";

function Settings() {
  const [storedUser, setStoredUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const token = localStorage.getItem("token");

  // =====================================================
  // CREATE ADMIN FORM
  // =====================================================

  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  // =====================================================
  // ADMINS
  // =====================================================

  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const [resetAdmin, setResetAdmin] = useState(null);

  const [resetForm, setResetForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [resetLoading, setResetLoading] = useState(false);

  // =====================================================
  // MESSAGES
  // =====================================================

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // DELETE ADMIN
  // =====================================================

  const [deleteLoading, setDeleteLoading] = useState(null);

  // =====================================================
  // CLEAR MESSAGES
  // =====================================================

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  // =====================================================
  // ADMIN INPUT CHANGE
  // =====================================================

  const handleAdminChange = (e) => {
    const { name, value } = e.target;

    setAdminForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearMessages();
  };

  // =====================================================
  // LOAD ADMINS
  // =====================================================

  const loadAdmins = async () => {
    if (storedUser.role !== "admin") {
      return;
    }

    try {
      setAdminsLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/admins`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load administrators."
        );
      }

      setAdmins(
        Array.isArray(data.admins)
          ? data.admins
          : []
      );
    } catch (err) {
      console.error(
        "Load admins error:",
        err
      );

      setError(
        err.message ||
          "Failed to load administrators."
      );
    } finally {
      setAdminsLoading(false);
    }
  };

  // =====================================================
  // LOAD ADMINS WHEN PAGE OPENS
  // =====================================================

  useEffect(() => {
    loadAdmins();
  }, []);

  // =====================================================
  // CREATE ADMIN
  // =====================================================

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!adminForm.name.trim()) {
      setError("Please enter admin name.");
      return;
    }

    if (!adminForm.email.trim()) {
      setError("Please enter admin email.");
      return;
    }

    if (adminForm.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (
      adminForm.password !==
      adminForm.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/create-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: adminForm.name.trim(),
            email: adminForm.email.trim(),
            password: adminForm.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to create admin."
        );
      }

      setMessage(
        "New administrator created successfully! 👑"
      );

      setAdminForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      await loadAdmins();
    } catch (err) {
      console.error(
        "Create admin error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // OPEN RESET PASSWORD
  // =====================================================

  const openResetPassword = (admin) => {
    clearMessages();

    if (
      Number(admin.id) ===
      Number(storedUser.id)
    ) {
      setError(
        "You cannot reset your own password from Admin Management. Please use Profile → Change Password."
      );

      return;
    }

    setResetAdmin(admin);

    setResetForm({
      password: "",
      confirmPassword: "",
    });
  };

  // =====================================================
  // CLOSE RESET PASSWORD
  // =====================================================

  const closeResetPassword = () => {
    setResetAdmin(null);

    setResetForm({
      password: "",
      confirmPassword: "",
    });

    setResetLoading(false);
    setError("");
  };

  // =====================================================
  // RESET PASSWORD INPUT
  // =====================================================

  const handleResetChange = (e) => {
    const { name, value } = e.target;

    setResetForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!resetAdmin) {
      return;
    }

    if (resetForm.password.length < 6) {
      setError(
        "New password must be at least 6 characters."
      );

      return;
    }

    if (
      resetForm.password !==
      resetForm.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    if (
      Number(resetAdmin.id) ===
      Number(storedUser.id)
    ) {
      setError(
        "You cannot reset your own password from Admin Management."
      );

      return;
    }

    try {
      setResetLoading(true);

      const response = await fetch(
        `${API_URL}/admin/admins/${resetAdmin.id}/reset-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: resetForm.password,
            confirmPassword:
              resetForm.confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to reset password."
        );
      }

      const adminName =
        resetAdmin.name;

      closeResetPassword();

      setMessage(
        `Password reset successfully for ${adminName}. 🔐`
      );
    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      setError(
        err.message ||
          "Failed to reset password."
      );
    } finally {
      setResetLoading(false);
    }
  };

  // =====================================================
  // DELETE ADMIN
  // =====================================================

  const handleDeleteAdmin = async (admin) => {
    clearMessages();

    // ---------------------------------------------------
    // CURRENT ADMIN PROTECTION
    // ---------------------------------------------------

    if (
      Number(admin.id) ===
      Number(storedUser.id)
    ) {
      setError(
        "You cannot remove your own administrator account."
      );

      return;
    }

    // ---------------------------------------------------
    // CONFIRM DELETE
    // ---------------------------------------------------

    const confirmDelete =
      window.confirm(
        `Are you sure you want to remove administrator "${admin.name}"?\n\nThis action cannot be undone.`
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeleteLoading(admin.id);

      const response = await fetch(
        `${API_URL}/admin/admins/${admin.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to remove administrator."
        );
      }

      setMessage(
        `Administrator "${admin.name}" removed successfully. 🗑️`
      );

      await loadAdmins();
    } catch (err) {
      console.error(
        "Delete admin error:",
        err
      );

      setError(
        err.message ||
          "Failed to remove administrator."
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  // =====================================================
  // ROLE TEXT
  // =====================================================

  const roleText = storedUser.role
    ? storedUser.role.charAt(0).toUpperCase() +
      storedUser.role.slice(1)
    : "Admin";

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="patient-page">
      <div className="patient-list-page">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="patient-list-header">
          <div>
            <h1>Settings</h1>

            <p>
              Manage your account and system settings.
            </p>
          </div>
        </div>

        {/* =================================================
            GLOBAL MESSAGE
        ================================================= */}

        {error && !resetAdmin && (
          <div className="settings-error">
            {error}
          </div>
        )}

        {message && !resetAdmin && (
          <div className="settings-success">
            {message}
          </div>
        )}

        {/* =================================================
            PROFILE
        ================================================= */}

        <div className="patient-section-card">

          <div className="patient-section-title">
            <div>
              <h2>👤 Profile</h2>

              <p>
                Your current account information
              </p>
            </div>
          </div>

          <div className="settings-profile-grid">

            <div className="settings-profile-item">
              <span>Name</span>

              <strong>
                {storedUser.name ||
                  "Admin"}
              </strong>
            </div>

            <div className="settings-profile-item">
              <span>Email</span>

              <strong>
                {storedUser.email ||
                  "admin@gmail.com"}
              </strong>
            </div>

            <div className="settings-profile-item">
              <span>Role</span>

              <strong className="settings-role-badge">
                {roleText}
              </strong>
            </div>

          </div>

          <div
            style={{
              marginTop: "18px",
              padding: "14px 16px",
              background: "#f8fafc",
              borderRadius: "10px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            🔐 To update your profile information
            or change your own password, use the{" "}
            <strong>Profile</strong> section.
          </div>

        </div>

        {/* =================================================
            ADMIN ONLY
        ================================================= */}

        {storedUser.role === "admin" && (
          <>

            {/* =================================================
                CREATE ADMIN
            ================================================= */}

            <div className="patient-section-card">

              <div className="patient-section-title">
                <div>
                  <h2>
                    👑 Admin Management
                  </h2>

                  <p>
                    Create a new administrator account.
                  </p>
                </div>
              </div>

              <form
                onSubmit={
                  handleCreateAdmin
                }
              >

                <div className="settings-form-grid">

                  {/* NAME */}

                  <div className="settings-form-group">
                    <label>
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        adminForm.name
                      }
                      onChange={
                        handleAdminChange
                      }
                      placeholder="Enter admin name"
                      autoComplete="off"
                    />
                  </div>

                  {/* EMAIL */}

                  <div className="settings-form-group">
                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={
                        adminForm.email
                      }
                      onChange={
                        handleAdminChange
                      }
                      placeholder="admin@example.com"
                      autoComplete="off"
                    />
                  </div>

                  {/* PASSWORD */}

                  <div className="settings-form-group">
                    <label>
                      Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={
                        adminForm.password
                      }
                      onChange={
                        handleAdminChange
                      }
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                    />
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div className="settings-form-group">
                    <label>
                      Confirm Password
                    </label>

                    <input
                      type="password"
                      name="confirmPassword"
                      value={
                        adminForm.confirmPassword
                      }
                      onChange={
                        handleAdminChange
                      }
                      placeholder="Confirm password"
                      autoComplete="new-password"
                    />
                  </div>

                </div>

                {error && !resetAdmin && (
                  <div className="settings-error">
                    {error}
                  </div>
                )}

                {message && !resetAdmin && (
                  <div className="settings-success">
                    {message}
                  </div>
                )}

                <div className="settings-button-wrapper">

                  <button
                    type="submit"
                    className="settings-primary-btn"
                    disabled={loading}
                  >
                    {loading
                      ? "Creating..."
                      : "👑 Create Admin"}
                  </button>

                </div>

              </form>

            </div>

            {/* =================================================
                ADMIN LIST
            ================================================= */}

            <div className="patient-section-card">

              <div
                className="patient-section-title"
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >

                <div>
                  <h2>
                    🔐 Administrator Accounts
                  </h2>

                  <p>
                    View, manage and remove administrator
                    accounts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadAdmins}
                  className="settings-reset-btn"
                  disabled={adminsLoading}
                >
                  {adminsLoading
                    ? "Refreshing..."
                    : "↻ Refresh"}
                </button>

              </div>

              {adminsLoading ? (
                <div className="settings-loading">

                  <div
                    style={{
                      fontSize: "28px",
                      marginBottom: "8px",
                    }}
                  >
                    ⏳
                  </div>

                  Loading administrators...

                </div>
              ) : admins.length === 0 ? (
                <div className="settings-empty">

                  <div
                    style={{
                      fontSize: "35px",
                      marginBottom: "8px",
                    }}
                  >
                    👥
                  </div>

                  No administrator accounts found.

                </div>
              ) : (
                <div className="admins-table-container">

                  <table className="admins-table">

                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>

                      {admins.map((admin) => {

                        const isCurrentAdmin =
                          Number(admin.id) ===
                          Number(storedUser.id);

                        const isDeleting =
                          Number(deleteLoading) ===
                          Number(admin.id);

                        return (
                          <tr
                            key={admin.id}
                          >

                            {/* ID */}

                            <td>
                              #{admin.id}
                            </td>

                            {/* NAME */}

                            <td>

                              <strong>
                                {admin.name}
                              </strong>

                              {isCurrentAdmin && (
                                <div
                                  style={{
                                    fontSize:
                                      "11px",
                                    color:
                                      "#64748b",
                                    marginTop:
                                      "3px",
                                  }}
                                >
                                  You
                                </div>
                              )}

                            </td>

                            {/* EMAIL */}

                            <td>
                              {admin.email}
                            </td>

                            {/* ROLE */}

                            <td>

                              <span className="settings-role-badge">
                                Admin
                              </span>

                            </td>

                            {/* ACTION */}

                            <td>

                              {isCurrentAdmin ? (

                                <span className="settings-current-account">
                                  Current Account
                                </span>

                              ) : (

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    gap: "8px",
                                    flexWrap:
                                      "wrap",
                                  }}
                                >

                                  {/* RESET */}

                                  <button
                                    type="button"
                                    className="settings-reset-btn"
                                    onClick={() =>
                                      openResetPassword(
                                        admin
                                      )
                                    }
                                    disabled={
                                      isDeleting
                                    }
                                  >
                                    🔐 Reset Password
                                  </button>

                                  {/* DELETE */}

                                  <button
                                    type="button"
                                    className="settings-delete-btn"
                                    onClick={() =>
                                      handleDeleteAdmin(
                                        admin
                                      )
                                    }
                                    disabled={
                                      isDeleting
                                    }
                                  >
                                    {isDeleting
                                      ? "Removing..."
                                      : "🗑️ Remove"}
                                  </button>

                                </div>

                              )}

                            </td>

                          </tr>
                        );
                      })}

                    </tbody>

                  </table>

                </div>
              )}

              {/* =================================================
                  SECURITY NOTE
              ================================================= */}

              <div
                style={{
                  marginTop: "16px",
                  padding: "13px 15px",
                  background: "#f8fafc",
                  borderRadius: "9px",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                🛡️ Security: You cannot reset or remove
                your own administrator account from Admin
                Management.
              </div>

            </div>

          </>
        )}

        {/* =================================================
            RESET PASSWORD MODAL
        ================================================= */}

        {resetAdmin && (
          <div className="settings-modal-overlay">

            <div className="settings-modal">

              <div className="settings-modal-header">

                <div>

                  <h2>
                    🔐 Reset Password
                  </h2>

                  <p>
                    Reset password for{" "}
                    <strong>
                      {resetAdmin.name}
                    </strong>
                  </p>

                </div>

                <button
                  type="button"
                  className="settings-modal-close"
                  onClick={
                    closeResetPassword
                  }
                  disabled={resetLoading}
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={
                  handleResetPassword
                }
              >

                <div className="settings-form-group">

                  <label>
                    New Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={
                      resetForm.password
                    }
                    onChange={
                      handleResetChange
                    }
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    autoFocus
                  />

                </div>

                <div className="settings-form-group">

                  <label>
                    Confirm New Password
                  </label>

                  <input
                    type="password"
                    name="confirmPassword"
                    value={
                      resetForm.confirmPassword
                    }
                    onChange={
                      handleResetChange
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />

                </div>

                {error && (
                  <div className="settings-error">
                    {error}
                  </div>
                )}

                <div className="settings-modal-actions">

                  <button
                    type="button"
                    className="settings-cancel-btn"
                    onClick={
                      closeResetPassword
                    }
                    disabled={resetLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="settings-primary-btn"
                    disabled={resetLoading}
                  >
                    {resetLoading
                      ? "Resetting..."
                      : "🔐 Reset Password"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Settings;