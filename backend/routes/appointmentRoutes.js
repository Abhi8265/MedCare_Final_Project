const express = require("express");
const db = require("../db");

const router = express.Router();

// =====================================================
// GET ALL APPOINTMENTS
// ADMIN   = ALL
// DOCTOR  = OWN ASSIGNED APPOINTMENTS
// PATIENT = OWN APPOINTMENTS
// =====================================================
router.get("/", (req, res) => {
  const role = req.user?.role;
  const userId = req.user?.id;

  let sql = `
    SELECT
      appointments.id,
      appointments.patient_id,
      appointments.doctor_id,
      appointments.appointment_date,
      appointments.appointment_time,
      appointments.reason,
      appointments.status,

      patients.id AS patient_record_id,
      patient_users.name AS patient_name,

      doctors.id AS doctor_record_id,
      doctor_users.name AS doctor_name,
      doctors.department,
      doctors.specialization

    FROM appointments

    INNER JOIN patients
      ON appointments.patient_id = patients.id

    INNER JOIN users AS patient_users
      ON patients.user_id = patient_users.id

    INNER JOIN doctors
      ON appointments.doctor_id = doctors.id

    INNER JOIN users AS doctor_users
      ON doctors.user_id = doctor_users.id
  `;

  const params = [];

  // PATIENT → only own appointments
  if (role === "patient") {
    sql += ` WHERE patients.user_id = ? `;
    params.push(userId);
  }

  // DOCTOR → only assigned appointments
  else if (role === "doctor") {
    sql += ` WHERE doctors.user_id = ? `;
    params.push(userId);
  }

  sql += `
    ORDER BY appointments.appointment_date DESC,
             appointments.appointment_time DESC
  `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Get appointments error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch appointments",
      });
    }

    res.json({
      success: true,
      appointments: results,
    });
  });
});

// =====================================================
// GET SINGLE APPOINTMENT
// ADMIN   = ANY
// DOCTOR  = OWN
// PATIENT = OWN
// =====================================================
router.get("/:id", (req, res) => {
  const appointmentId = req.params.id;
  const role = req.user?.role;
  const userId = req.user?.id;

  let sql = `
    SELECT
      appointments.id,
      appointments.patient_id,
      appointments.doctor_id,
      appointments.appointment_date,
      appointments.appointment_time,
      appointments.reason,
      appointments.status,

      patients.user_id AS patient_user_id,
      doctors.user_id AS doctor_user_id,

      patient_users.name AS patient_name,
      doctor_users.name AS doctor_name,
      doctors.department,
      doctors.specialization

    FROM appointments

    INNER JOIN patients
      ON appointments.patient_id = patients.id

    INNER JOIN users AS patient_users
      ON patients.user_id = patient_users.id

    INNER JOIN doctors
      ON appointments.doctor_id = doctors.id

    INNER JOIN users AS doctor_users
      ON doctors.user_id = doctor_users.id

    WHERE appointments.id = ?
  `;

  const params = [appointmentId];

  // PATIENT → own appointment only
  if (role === "patient") {
    sql += ` AND patients.user_id = ? `;
    params.push(userId);
  }

  // DOCTOR → own assigned appointment only
  else if (role === "doctor") {
    sql += ` AND doctors.user_id = ? `;
    params.push(userId);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Get appointment error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch appointment",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      appointment: results[0],
    });
  });
});

// =====================================================
// CREATE APPOINTMENT
// ADMIN + PATIENT
// =====================================================
router.post("/", (req, res) => {
  const role = req.user?.role;
  const userId = req.user?.id;

  // Only Admin and Patient can book
  if (role !== "admin" && role !== "patient") {
    return res.status(403).json({
      success: false,
      message: "Only admin or patient can book appointments.",
    });
  }

  const {
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    reason,
    status,
  } = req.body;

  // Required fields
  if (
    !patient_id ||
    !doctor_id ||
    !appointment_date ||
    !appointment_time
  ) {
    return res.status(400).json({
      success: false,
      message: "Patient, doctor, date and time are required",
    });
  }

  // -----------------------------------------------------
  // PATIENT → can book only for himself
  // -----------------------------------------------------
  if (role === "patient") {
    db.query(
      "SELECT id FROM patients WHERE id = ? AND user_id = ?",
      [patient_id, userId],
      (patientErr, patientResults) => {
        if (patientErr) {
          console.error(
            "Check patient ownership error:",
            patientErr
          );

          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        if (patientResults.length === 0) {
          return res.status(403).json({
            success: false,
            message:
              "You can only book an appointment for yourself.",
          });
        }

        createAppointment();
      }
    );
  } else {
    createAppointment();
  }

  // -----------------------------------------------------
  // INSERT APPOINTMENT
  // -----------------------------------------------------
  function createAppointment() {
    const sql = `
      INSERT INTO appointments
      (
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    // Default status = confirmed
    const appointmentStatus =
      status || "confirmed";

    db.query(
      sql,
      [
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason || null,
        appointmentStatus,
      ],
      (err, result) => {
        if (err) {
          console.error(
            "Create appointment error:",
            err
          );

          return res.status(500).json({
            success: false,
            message: "Failed to create appointment",
          });
        }

        res.status(201).json({
          success: true,
          message: "Appointment booked successfully",
          appointmentId: result.insertId,
        });
      }
    );
  }
});

// =====================================================
// UPDATE APPOINTMENT FUNCTION
//
// PATCH:
// ADMIN   = change status
// DOCTOR  = change status of own appointment
//
// PUT:
// ADMIN   = full appointment update
// DOCTOR  = not allowed
// =====================================================
const updateAppointment = (req, res) => {
  const appointmentId = req.params.id;
  const role = req.user?.role;
  const userId = req.user?.id;

  // Only Admin and Doctor can update
  if (role !== "admin" && role !== "doctor") {
    return res.status(403).json({
      success: false,
      message:
        "You do not have permission to update appointments.",
    });
  }

  // =====================================================
  // PATCH → STATUS UPDATE
  // =====================================================
  if (req.method === "PATCH") {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Appointment status is required.",
      });
    }

    // Only these statuses are allowed
    const allowedStatuses = [
      "confirmed",
      "completed",
      "cancelled",
    ];

    const finalStatus = String(status).toLowerCase();

    if (!allowedStatuses.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed: confirmed, completed, cancelled.",
      });
    }

    // =================================================
    // DOCTOR → ONLY OWN ASSIGNED APPOINTMENT
    // =================================================
    if (role === "doctor") {
      const sql = `
        UPDATE appointments
        SET status = ?
        WHERE id = ?
        AND doctor_id IN (
          SELECT id
          FROM doctors
          WHERE user_id = ?
        )
      `;

      db.query(
        sql,
        [finalStatus, appointmentId, userId],
        (err, result) => {
          if (err) {
            console.error(
              "Doctor status update error:",
              err
            );

            return res.status(500).json({
              success: false,
              message:
                "Failed to update appointment status.",
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              message:
                "Appointment not found or not assigned to you.",
            });
          }

          return res.json({
            success: true,
            message:
              "Appointment status updated successfully.",
            status: finalStatus,
          });
        }
      );

      return;
    }

    // =================================================
    // ADMIN → STATUS UPDATE ANY APPOINTMENT
    // =================================================
    const sql = `
      UPDATE appointments
      SET status = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [finalStatus, appointmentId],
      (err, result) => {
        if (err) {
          console.error(
            "Admin status update error:",
            err
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to update appointment status.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Appointment not found.",
          });
        }

        return res.json({
          success: true,
          message:
            "Appointment status updated successfully.",
          status: finalStatus,
        });
      }
    );

    return;
  }

  // =====================================================
  // PUT → ADMIN FULL UPDATE
  // =====================================================
  if (req.method === "PUT") {
    // Only Admin can perform full update
    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only admin can perform full appointment updates.",
      });
    }

    const {
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason,
      status,
    } = req.body;

    if (
      !patient_id ||
      !doctor_id ||
      !appointment_date ||
      !appointment_time
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Patient, doctor, date and time are required.",
      });
    }

    const allowedStatuses = [
      "confirmed",
      "completed",
      "cancelled",
    ];

    const finalStatus = String(
      status || "confirmed"
    ).toLowerCase();

    if (!allowedStatuses.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed: confirmed, completed, cancelled.",
      });
    }

    const sql = `
      UPDATE appointments
      SET
        patient_id = ?,
        doctor_id = ?,
        appointment_date = ?,
        appointment_time = ?,
        reason = ?,
        status = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason || null,
        finalStatus,
        appointmentId,
      ],
      (err, result) => {
        if (err) {
          console.error(
            "Admin full update error:",
            err
          );

          return res.status(500).json({
            success: false,
            message: "Failed to update appointment.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Appointment not found.",
          });
        }

        return res.json({
          success: true,
          message:
            "Appointment updated successfully.",
          status: finalStatus,
        });
      }
    );

    return;
  }
};

// =====================================================
// PATCH ROUTE
// AppointmentList.jsx uses PATCH
// =====================================================
router.patch("/:id", updateAppointment);

// =====================================================
// PUT ROUTE
// Kept for future Admin full editing
// =====================================================
router.put("/:id", updateAppointment);

// =====================================================
// DELETE APPOINTMENT
// ADMIN ONLY
// =====================================================
router.delete("/:id", (req, res) => {
  // Only Admin can delete
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can delete appointments.",
    });
  }

  const appointmentId = req.params.id;

  db.query(
    "DELETE FROM appointments WHERE id = ?",
    [appointmentId],
    (err, result) => {
      if (err) {
        console.error(
          "Delete appointment error:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Failed to delete appointment",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      res.json({
        success: true,
        message:
          "Appointment deleted successfully",
      });
    }
  );
});

module.exports = router;