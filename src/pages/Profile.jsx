import { useEffect, useRef, useState } from "react";

const API_URL = "https://medcarefinalproject-production.up.railway.app/api";

function Profile() {
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordLoading, setPasswordLoading] =
    useState(false);
  const [passwordMessage, setPasswordMessage] =
    useState("");
  const [passwordError, setPasswordError] =
    useState("");

  const [profilePhoto, setProfilePhoto] =
    useState("");

  const fileInputRef = useRef(null);

  // =====================================================
  // LOAD USER FROM LOCAL STORAGE
  // =====================================================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      setUser(parsedUser);
      setName(parsedUser.name || "");
      setEmail(parsedUser.email || "");

      const savedPhoto = localStorage.getItem(
        `profilePhoto_${parsedUser.id}`
      );

      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      }
    } catch (err) {
      console.error(
        "Profile local storage error:",
        err
      );
    }

    fetchProfile();
  }, []);

  // =====================================================
  // GET PROFILE FROM BACKEND
  // =====================================================
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load profile."
        );
      }

      const profileUser = data.user;

      setUser(profileUser);
      setName(profileUser.name || "");
      setEmail(profileUser.email || "");

      localStorage.setItem(
        "user",
        JSON.stringify(profileUser)
      );
    } catch (err) {
      console.error(
        "Fetch profile error:",
        err
      );

      setError(
        err.message || "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UPDATE PROFILE
  // =====================================================
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login again.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update profile."
        );
      }

      const updatedUser = data.user;

      setUser(updatedUser);
      setName(updatedUser.name || "");
      setEmail(updatedUser.email || "");

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setMessage(
        "Profile updated successfully! ✅"
      );
    } catch (err) {
      console.error(
        "Update profile error:",
        err
      );

      setError(
        err.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // PROFILE PHOTO
  // =====================================================
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setMessage("");
    setError("");

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile photo must be less than 5 MB."
      );

      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const photo = reader.result;

      setProfilePhoto(photo);

      if (user?.id) {
        localStorage.setItem(
          `profilePhoto_${user.id}`,
          photo
        );
      }

      setMessage(
        "Profile photo updated successfully! 📸"
      );
    };

    reader.onerror = () => {
      setError(
        "Failed to load profile photo."
      );
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  };

  // =====================================================
  // REMOVE PROFILE PHOTO
  // =====================================================
  const handleRemovePhoto = () => {
    if (!user?.id) return;

    localStorage.removeItem(
      `profilePhoto_${user.id}`
    );

    setProfilePhoto("");

    setMessage(
      "Profile photo removed successfully."
    );
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "All password fields are required."
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirm password do not match."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setPasswordError(
        "Please login again."
      );
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        // Only logout if token itself is invalid.
        if (
          data.message ===
          "Authentication required."
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.reload();
          return;
        }
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to change password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Password changed successfully! 🔐"
      );
    } catch (err) {
      console.error(
        "Change password error:",
        err
      );

      setPasswordError(
        err.message ||
          "Failed to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.reload();
  };

  // =====================================================
  // INITIALS
  // =====================================================
  const getInitials = (fullName) => {
    if (!fullName) return "U";

    return fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="patient-page">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          Loading profile...
        </div>
      </div>
    );
  }

  // =====================================================
  // NO USER
  // =====================================================
  if (!user) {
    return (
      <div className="patient-page">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h2>Profile unavailable</h2>
          <p>Please login again.</p>

          <button
            onClick={handleLogout}
            style={{
              marginTop: "15px",
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Login Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-page">
      {/* =================================================
          PROFILE HEADER
      ================================================= */}
      <div
        className="patient-list-header"
        style={{
          marginBottom: "25px",
        }}
      >
        <div>
          <h1>My Profile</h1>
          <p>
            Manage your account information and
            security.
          </p>
        </div>
      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}
      {message && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "8px",
            background: "#ecfdf5",
            color: "#047857",
            border: "1px solid #a7f3d0",
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "8px",
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* =================================================
          PROFILE CARD
      ================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(260px, 320px) 1fr",
          gap: "25px",
          marginBottom: "25px",
        }}
      >
        {/* PROFILE PHOTO */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "30px 20px",
            textAlign: "center",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              width: "130px",
              height: "130px",
              borderRadius: "50%",
              margin: "0 auto 18px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, #dbeafe, #bfdbfe)",
              fontSize: "42px",
              fontWeight: "700",
              color: "#1d4ed8",
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
                }}
              />
            ) : (
              getInitials(user.name)
            )}
          </div>

          <h2
            style={{
              margin: "0 0 5px",
              fontSize: "20px",
            }}
          >
            {user.name}
          </h2>

          <p
            style={{
              margin: "0 0 4px",
              color: "#64748b",
            }}
          >
            {user.email}
          </p>

          <span
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "5px 12px",
              borderRadius: "20px",
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: "13px",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {user.role}
          </span>

          <div
            style={{
              marginTop: "22px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              style={{
                padding: "10px 15px",
                border: "1px solid #2563eb",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              📷 Change Photo
            </button>

            {profilePhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                style={{
                  padding: "10px 15px",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Remove Photo
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
          </div>

          <p
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            JPG, PNG or WEBP • Max 5 MB
          </p>
        </div>

        {/* PROFILE INFORMATION */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "30px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "25px",
            }}
          >
            Personal Information
          </h2>

          <form onSubmit={handleProfileUpdate}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "20px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your name"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border:
                      "1px solid #dbe2ea",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border:
                      "1px solid #dbe2ea",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  Role
                </label>

                <input
                  type="text"
                  value={user.role || ""}
                  disabled
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border:
                      "1px solid #dbe2ea",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    fontSize: "14px",
                    background: "#f8fafc",
                    textTransform:
                      "capitalize",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  User ID
                </label>

                <input
                  type="text"
                  value={user.id || ""}
                  disabled
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border:
                      "1px solid #dbe2ea",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    fontSize: "14px",
                    background: "#f8fafc",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: "25px",
                padding: "12px 22px",
                border: "none",
                borderRadius: "8px",
                background: saving
                  ? "#94a3b8"
                  : "#2563eb",
                color: "#fff",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                fontWeight: "600",
              }}
            >
              {saving
                ? "Saving..."
                : "💾 Save Changes"}
            </button>
          </form>
        </div>
      </div>

      {/* =================================================
          CHANGE PASSWORD
      ================================================= */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "25px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          🔐 Change Password
        </h2>

        <p
          style={{
            color: "#64748b",
            marginBottom: "25px",
          }}
        >
          Update your account password to keep
          your account secure.
        </p>

        {passwordMessage && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: "20px",
              borderRadius: "8px",
              background: "#ecfdf5",
              color: "#047857",
              border:
                "1px solid #a7f3d0",
            }}
          >
            {passwordMessage}
          </div>
        )}

        {passwordError && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: "20px",
              borderRadius: "8px",
              background: "#fef2f2",
              color: "#b91c1c",
              border:
                "1px solid #fecaca",
            }}
          >
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Current Password
              </label>

              <input
                type="password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(
                    e.target.value
                  )
                }
                placeholder="Current password"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border:
                    "1px solid #dbe2ea",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
                placeholder="New password"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border:
                    "1px solid #dbe2ea",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm password"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border:
                    "1px solid #dbe2ea",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            style={{
              marginTop: "25px",
              padding: "12px 22px",
              border: "none",
              borderRadius: "8px",
              background: passwordLoading
                ? "#94a3b8"
                : "#0f766e",
              color: "#fff",
              cursor: passwordLoading
                ? "not-allowed"
                : "pointer",
              fontWeight: "600",
            }}
          >
            {passwordLoading
              ? "Changing..."
              : "🔐 Change Password"}
          </button>
        </form>
      </div>

      {/* =================================================
          ACCOUNT / LOGOUT
      ================================================= */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "25px 30px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 5px",
            }}
          >
            Account Session
          </h3>

          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            Logout from your current hospital
            management account.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "11px 22px",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            background: "#fef2f2",
            color: "#dc2626",
            cursor: "pointer",
            fontWeight: "600",
            whiteSpace: "nowrap",
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default Profile; 