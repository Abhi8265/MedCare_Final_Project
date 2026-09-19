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
// CORS - PRODUCTION
// =================================================

const allowedOrigins = [
  "https://med-care-final-project.vercel.app",
  "https://med-care-final-project-git-main-med-care2.vercel.app",
];


// =================================================
// CORS MIDDLEWARE
// =================================================

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );

  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.header(
    "Access-Control-Allow-Credentials",
    "true"
  );

  // Browser preflight request
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});


// =================================================
// EXPRESS JSON
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

      res.json({
        success: true,
        message:
          "Database is working ✅",
        result: results,
      });
    }
  );
});


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
      `Server running on port ${PORT}`
    );
  }
);