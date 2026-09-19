const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authenticateToken = require("./authMiddleware");
const allowRoles = require("./roleMiddleware");

const db = require("./db");

const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const announcementRoutes = require("./routes/announcementRoutes");

const app = express();


// =================================================
// CORS
// =================================================

const allowedOrigins = [
  "https://med-care-final-project.vercel.app",
  "https://med-care-final-project-git-main-med-care2.vercel.app",
  "https://med-care-final-project-fyu1t7v5-med-care2.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {

    // Postman / direct requests
    if (!origin) {
      return callback(null, true);
    }

    // Exact allowed production domains
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Vercel preview deployments
    if (
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    // Local development
    if (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked:", origin);

    return callback(
      new Error("Not allowed by CORS")
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  credentials: true,

  optionsSuccessStatus: 204,
};


// CORS middleware
app.use(cors(corsOptions));


// Explicitly handle browser preflight requests
app.options(/.*/, cors(corsOptions));


// =================================================
// JSON
// =================================================

app.use(
  express.json({
    limit: "15mb",
  })
);


// =================================================
// AUTH
// =================================================

app.use(
  "/api/auth",
  authRoutes
);


// =================================================
// ADMIN
// =================================================

app.use(
  "/api/admin",
  authenticateToken,
  allowRoles("admin"),
  adminRoutes
);


// =================================================
// DASHBOARD
// =================================================

app.use(
  "/api/dashboard",
  authenticateToken,
  allowRoles(
    "admin",
    "doctor",
    "patient"
  ),
  dashboardRoutes
);


// =================================================
// PATIENTS
// =================================================

app.use(
  "/api/patients",
  authenticateToken,
  (req, res, next) => {

    if (req.method === "GET") {
      return allowRoles(
        "admin",
        "doctor",
        "patient"
      )(req, res, next);
    }

    if (
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "DELETE"
    ) {
      return allowRoles("admin")(
        req,
        res,
        next
      );
    }

    next();
  },
  patientRoutes
);


// =================================================
// DOCTORS
// =================================================

app.use(
  "/api/doctors",
  authenticateToken,
  (req, res, next) => {

    if (req.method === "GET") {
      return allowRoles(
        "admin",
        "doctor",
        "patient"
      )(req, res, next);
    }

    if (
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "DELETE"
    ) {
      return allowRoles("admin")(
        req,
        res,
        next
      );
    }

    next();
  },
  doctorRoutes
);


// =================================================
// APPOINTMENTS
// =================================================

app.use(
  "/api/appointments",
  authenticateToken,
  (req, res, next) => {

    if (req.method === "GET") {
      return allowRoles(
        "admin",
        "doctor",
        "patient"
      )(req, res, next);
    }

    if (req.method === "POST") {
      return allowRoles(
        "admin",
        "patient"
      )(req, res, next);
    }

    if (
      req.method === "PUT" ||
      req.method === "PATCH"
    ) {
      return allowRoles(
        "admin",
        "doctor"
      )(req, res, next);
    }

    if (req.method === "DELETE") {
      return allowRoles("admin")(
        req,
        res,
        next
      );
    }

    next();
  },
  appointmentRoutes
);


// =================================================
// PRESCRIPTIONS
// =================================================

app.use(
  "/api/prescriptions",
  authenticateToken,
  (req, res, next) => {

    if (req.method === "GET") {
      return allowRoles(
        "admin",
        "doctor",
        "patient"
      )(req, res, next);
    }

    if (
      req.method === "POST" ||
      req.method === "PUT"
    ) {
      return allowRoles(
        "admin",
        "doctor"
      )(req, res, next);
    }

    if (req.method === "DELETE") {
      return allowRoles("admin")(
        req,
        res,
        next
      );
    }

    next();
  },
  prescriptionRoutes
);


// =================================================
// MEDICAL RECORDS
// =================================================

app.use(
  "/api/medical-records",
  authenticateToken,
  (req, res, next) => {

    if (req.method === "GET") {
      return allowRoles(
        "admin",
        "doctor",
        "patient"
      )(req, res, next);
    }

    if (
      req.method === "POST" ||
      req.method === "PUT"
    ) {
      return allowRoles(
        "admin",
        "doctor"
      )(req, res, next);
    }

    if (req.method === "DELETE") {
      return allowRoles("admin")(
        req,
        res,
        next
      );
    }

    next();
  },
  medicalRecordRoutes
);


// =================================================
// ANNOUNCEMENTS
// =================================================

app.use(
  "/api/announcements",
  authenticateToken,
  allowRoles(
    "admin",
    "doctor",
    "patient"
  ),
  announcementRoutes
);


// =================================================
// HOME
// =================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Hospital Management System API is running 🚀",
  });
});


// =================================================
// DATABASE TEST
// =================================================

app.get("/api/test-db", (req, res) => {

  db.query(
    "SELECT 1 AS result",
    (err, results) => {

      if (err) {

        console.error(
          "Database test error:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Database connection failed",
        });
      }

      return res.json({
        success: true,
        message:
          "Database is working ✅",
        result: results,
      });
    }
  );
});


// =================================================
// 404
// =================================================

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });

});


// =================================================
// GLOBAL ERROR HANDLER
// =================================================

app.use(
  (err, req, res, next) => {

    console.error(
      "❌ Server error:",
      err.message
    );

    if (
      err.message ===
      "Not allowed by CORS"
    ) {

      return res.status(403).json({
        success: false,
        message:
          "CORS origin not allowed",
      });

    }

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });

  }
);


// =================================================
// SERVER
// =================================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `🚀 Server running on port ${PORT}`
    );

    console.log(
      `🌐 Environment: ${process.env.NODE_ENV || "production"}`
    );

  }
);