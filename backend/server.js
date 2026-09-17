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
// MIDDLEWARE
// =================================================

app.use(cors());

app.use(
  express.json({
    limit: "15mb",
  })
);


// =================================================
// AUTH
// =================================================

app.use(
  "/api/admin",
  authenticateToken,
  allowRoles("admin"),
  adminRoutes
);
app.use(
  "/api/auth",
  authRoutes
);


// =================================================
// DASHBOARD
// Admin + Doctor + Patient
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
//
// GET    = Admin + Doctor + Patient
// POST   = Admin only
// PUT    = Admin only
// DELETE = Admin only
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
//
// GET    = Admin + Doctor + Patient
// POST   = Admin only
// PUT    = Admin only
// DELETE = Admin only
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
//
// GET    = Admin + Doctor + Patient
// POST   = Admin + Patient
// PUT    = Admin + Doctor
// PATCH  = Admin + Doctor
// DELETE = Admin only
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
//
// GET    = Admin + Doctor + Patient
// POST   = Admin + Doctor
// PUT    = Admin + Doctor
// DELETE = Admin only
// =================================================

app.use(
  "/api/prescriptions",
  authenticateToken,
  (req, res, next) => {

    // View prescriptions
    if (req.method === "GET") {
      return allowRoles(
        "admin",
        "doctor",
        "patient"
      )(req, res, next);
    }

    // Create / Edit prescriptions
    if (
      req.method === "POST" ||
      req.method === "PUT"
    ) {
      return allowRoles(
        "admin",
        "doctor"
      )(req, res, next);
    }

    // Delete prescriptions
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
//
// GET    = Admin + Doctor + Patient
// POST   = Admin + Doctor
// PUT    = Admin + Doctor
// DELETE = Admin only
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
//
// Admin   = View + Create + Delete
// Doctor  = View
// Patient = View
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

app.get(
  "/",
  (req, res) => {
    res.json({
      message:
        "Hospital Management System API is running 🚀",
    });
  }
);


// =================================================
// DATABASE TEST
// =================================================

app.get(
  "/api/test-db",
  (req, res) => {

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

        res.json({
          success: true,
          message:
            "Database is working ✅",
          result: results,
        });
      }
    );
  }
);


// =================================================
// SERVER
// =================================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  }
);