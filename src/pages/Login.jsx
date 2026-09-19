import { useEffect, useState } from "react";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const loginImages = [
    "/images/login-hero-1.jpg",
    "/images/login-hero-2.jpg",
    "/images/login-hero-3.jpg",
  ];

  // Change image every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % loginImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login successful!");

        onLogin(data.user);
      } else {
        alert(data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        boxSizing: "border-box",
        background:
          "linear-gradient(135deg, #eaf6ff 0%, #dceeff 50%, #f5fbff 100%)",
        overflow: "auto",
      }}
    >
      <div
        style={{
          width: "min(1100px, 100%)",
          minHeight: "620px",
          display: "grid",
          gridTemplateColumns: "1fr 0.9fr",
          background: "#ffffff",
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow: "0 25px 70px rgba(30, 100, 170, 0.20)",
          position: "relative",
        }}
      >
        {/* LEFT IMAGE / MEDICAL SECTION */}
        <div
          style={{
            position: "relative",
            minHeight: "620px",
            overflow: "hidden",
            background: "#dcefff",
          }}
        >
          {loginImages.map((image, index) => (
            <img
              key={image}
              src={image}
              alt="MedCare Hospital"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: currentImage === index ? 1 : 0,
                transition: "opacity 0.8s ease-in-out",
              }}
            />
          ))}

          {/* Soft overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(9,72,125,0.08), rgba(5,45,85,0.48))",
            }}
          />

          {/* Carousel dots */}
          <div
            style={{
              position: "absolute",
              bottom: "28px",
              left: "42px",
              zIndex: 3,
              display: "flex",
              gap: "8px",
            }}
          >
            {loginImages.map((_, index) => (
              <div
                key={index}
                style={{
                  width: currentImage === index ? "28px" : "9px",
                  height: "9px",
                  borderRadius: "20px",
                  background:
                    currentImage === index
                      ? "#ffffff"
                      : "rgba(255,255,255,0.55)",
                  transition: "all 0.4s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* RIGHT LOGIN SECTION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "55px 60px",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "410px",
            }}
          >
            {/* Logo */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "34px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin: "0 auto 18px",
                  borderRadius: "18px",
                  background:
                    "linear-gradient(135deg, #1677ff, #2757d8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "31px",
                  boxShadow:
                    "0 12px 28px rgba(30,100,220,0.25)",
                }}
              >
                🏥
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  color: "#102a43",
                  fontWeight: "800",
                }}
              >
                Welcome Back!
              </h1>

              <p
                style={{
                  margin: "9px 0 0",
                  color: "#7890a8",
                  fontSize: "15px",
                }}
              >
                Login to your MedCare account
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: "22px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "9px",
                    color: "#17324d",
                    fontSize: "14px",
                    fontWeight: "700",
                  }}
                >
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    height: "52px",
                    boxSizing: "border-box",
                    border: "1px solid #d5e2ef",
                    borderRadius: "12px",
                    padding: "0 16px",
                    fontSize: "14px",
                    outline: "none",
                    color: "#17324d",
                    background: "#fbfdff",
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "9px",
                    color: "#17324d",
                    fontSize: "14px",
                    fontWeight: "700",
                  }}
                >
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    height: "52px",
                    boxSizing: "border-box",
                    border: "1px solid #d5e2ef",
                    borderRadius: "12px",
                    padding: "0 16px",
                    fontSize: "14px",
                    outline: "none",
                    color: "#17324d",
                    background: "#fbfdff",
                  }}
                />
              </div>

              {/* Remember */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "25px",
                  fontSize: "13px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#60758a",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#2477e8",
                    }}
                  />
                  Remember me
                </label>

                <span
                  style={{
                    color: "#1476e8",
                    fontWeight: "700",
                  }}
                >
                  Secure Login
                </span>
              </div>

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "55px",
                  border: "none",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #2385f5, #1d61d8)",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: "800",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow:
                    "0 10px 25px rgba(35,133,245,0.25)",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Logging in..." : "Login →"}
              </button>

              {/* Bottom */}
              <div
                style={{
                  textAlign: "center",
                  marginTop: "27px",
                  color: "#8a9caf",
                  fontSize: "13px",
                }}
              >
                <span>Secure access to your hospital dashboard</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 850px) {
          .login-page > div {
            grid-template-columns: 1fr !important;
          }

          .login-page > div > div:first-child {
            min-height: 360px !important;
          }

          .login-page > div > div:last-child {
            padding: 45px 28px !important;
          }
        }

        @media (max-width: 500px) {
          .login-page {
            padding: 15px !important;
          }

          .login-page > div {
            border-radius: 20px !important;
          }

          .login-page > div > div:first-child {
            min-height: 300px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;