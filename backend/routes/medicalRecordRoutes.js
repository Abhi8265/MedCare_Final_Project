const express = require("express");
const router = express.Router();

const db = require("../db");

// =====================================================
// GET ALL MEDICAL RECORDS
// Admin   -> All records
// Doctor  -> Only own records
// Patient -> Only own records
// =====================================================

router.get("/", (req, res) => {
  const { id, role } = req.user;

  let sql = `
    SELECT
      mr.id,
      mr.patient_id,
      mr.doctor_id,
      mr.appointment_id,
      mr.diagnosis,
      mr.symptoms,
      mr.treatment,
      mr.notes,
      mr.record_date,
      mr.created_at,

      pu.name AS patient_name,
      du.name AS doctor_name,
      d.department

    FROM medical_records mr

    INNER JOIN patients p
      ON mr.patient_id = p.id

    INNER JOIN users pu
      ON p.user_id = pu.id

    INNER JOIN doctors d
      ON mr.doctor_id = d.id

    INNER JOIN users du
      ON d.user_id = du.id
  `;

  const params = [];

  if (role === "patient") {
    sql += ` WHERE p.user_id = ? `;
    params.push(id);
  } else if (role === "doctor") {
    sql += ` WHERE d.user_id = ? `;
    params.push(id);
  }

  sql += ` ORDER BY mr.record_date DESC, mr.id DESC `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching medical records:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch medical records",
      });
    }

    return res.json({
      success: true,
      records: results,
    });
  });
});

// =====================================================
// GET SINGLE MEDICAL RECORD
// Admin   -> Any record
// Doctor  -> Only own record
// Patient -> Only own record
// =====================================================

router.get("/:id", (req, res) => {
  const recordId = Number(req.params.id);
  const { id, role } = req.user;

  if (!Number.isInteger(recordId) || recordId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid medical record ID",
    });
  }

  let sql = `
    SELECT
      mr.id,
      mr.patient_id,
      mr.doctor_id,
      mr.appointment_id,
      mr.diagnosis,
      mr.symptoms,
      mr.treatment,
      mr.notes,
      mr.record_date,
      mr.created_at,

      pu.name AS patient_name,
      du.name AS doctor_name,
      d.department

    FROM medical_records mr

    INNER JOIN patients p
      ON mr.patient_id = p.id

    INNER JOIN users pu
      ON p.user_id = pu.id

    INNER JOIN doctors d
      ON mr.doctor_id = d.id

    INNER JOIN users du
      ON d.user_id = du.id

    WHERE mr.id = ?
  `;

  const params = [recordId];

  if (role === "patient") {
    sql += ` AND p.user_id = ? `;
    params.push(id);
  } else if (role === "doctor") {
    sql += ` AND d.user_id = ? `;
    params.push(id);
  }

  sql += ` LIMIT 1 `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching medical record:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch medical record",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    return res.json({
      success: true,
      record: results[0],
    });
  });
});

// =====================================================
// ADD MEDICAL RECORD
// ADMIN + DOCTOR
//
// Admin:
// -> Can create for any patient/doctor
// -> Can use cancelled appointment
//
// Doctor:
// -> Can create only for himself
// -> Cannot use cancelled appointment
// =====================================================

router.post("/", (req, res) => {
  const { id, role } = req.user;

  if (role !== "admin" && role !== "doctor") {
    return res.status(403).json({
      success: false,
      message:
        "You do not have permission to add medical records.",
    });
  }

  let {
    patient_id,
    doctor_id,
    appointment_id,
    diagnosis,
    symptoms,
    treatment,
    notes,
    record_date,
  } = req.body;

  patient_id = Number(patient_id);
  doctor_id = Number(doctor_id);

  // -----------------------------------------------------
  // Validate patient and doctor
  // -----------------------------------------------------

  if (
    !Number.isInteger(patient_id) ||
    patient_id <= 0 ||
    !Number.isInteger(doctor_id) ||
    doctor_id <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid patient and doctor are required.",
    });
  }

  // -----------------------------------------------------
  // Validate required fields
  // -----------------------------------------------------

  if (
    !diagnosis ||
    !String(diagnosis).trim() ||
    !record_date
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Patient, doctor, diagnosis and record date are required.",
    });
  }

  // -----------------------------------------------------
  // Verify patient
  // -----------------------------------------------------

  db.query(
    `
      SELECT id
      FROM patients
      WHERE id = ?
      LIMIT 1
    `,
    [patient_id],
    (patientErr, patientResults) => {
      if (patientErr) {
        console.error(
          "❌ Patient verification error:",
          patientErr
        );

        return res.status(500).json({
          success: false,
          message: "Failed to verify patient.",
        });
      }

      if (patientResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient not found.",
        });
      }

      verifyDoctor();
    }
  );

  // -----------------------------------------------------
  // Verify doctor
  // -----------------------------------------------------

  function verifyDoctor() {
    db.query(
      `
        SELECT id
        FROM doctors
        WHERE id = ?
        LIMIT 1
      `,
      [doctor_id],
      (doctorErr, doctorResults) => {
        if (doctorErr) {
          console.error(
            "❌ Doctor verification error:",
            doctorErr
          );

          return res.status(500).json({
            success: false,
            message: "Failed to verify doctor.",
          });
        }

        if (doctorResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Doctor not found.",
          });
        }

        // Doctor can only create for himself
        if (role === "doctor") {
          db.query(
            `
              SELECT id
              FROM doctors
              WHERE id = ?
                AND user_id = ?
              LIMIT 1
            `,
            [doctor_id, id],
            (ownerErr, ownerResults) => {
              if (ownerErr) {
                console.error(
                  "❌ Doctor ownership error:",
                  ownerErr
                );

                return res.status(500).json({
                  success: false,
                  message: "Failed to verify doctor.",
                });
              }

              if (ownerResults.length === 0) {
                return res.status(403).json({
                  success: false,
                  message:
                    "You can only create medical records for yourself.",
                });
              }

              verifyAppointment();
            }
          );

          return;
        }

        // Admin -> full access
        verifyAppointment();
      }
    );
  }

  // -----------------------------------------------------
  // Verify appointment
  // Appointment is optional
  // -----------------------------------------------------

  function verifyAppointment() {
    if (
      appointment_id === undefined ||
      appointment_id === null ||
      String(appointment_id).trim() === ""
    ) {
      return insertRecord(null);
    }

    const appointmentId = Number(appointment_id);

    if (
      !Number.isInteger(appointmentId) ||
      appointmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    db.query(
      `
        SELECT
          id,
          patient_id,
          doctor_id,
          status
        FROM appointments
        WHERE id = ?
        LIMIT 1
      `,
      [appointmentId],
      (appointmentErr, appointmentResults) => {
        if (appointmentErr) {
          console.error(
            "❌ Appointment verification error:",
            appointmentErr
          );

          return res.status(500).json({
            success: false,
            message: "Failed to verify appointment.",
          });
        }

        if (appointmentResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Appointment not found.",
          });
        }

        const appointment = appointmentResults[0];

        // -------------------------------------------------
        // ONLY DOCTOR is blocked from cancelled appointment
        // ADMIN has full access
        // -------------------------------------------------

        if (
          role === "doctor" &&
          String(appointment.status || "").toLowerCase() ===
            "cancelled"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Medical record cannot be created for a cancelled appointment.",
          });
        }

        // -------------------------------------------------
        // Appointment patient must match
        // -------------------------------------------------

        if (Number(appointment.patient_id) !== patient_id) {
          return res.status(400).json({
            success: false,
            message:
              "Selected patient does not belong to this appointment.",
          });
        }

        // -------------------------------------------------
        // Appointment doctor must match
        // -------------------------------------------------

        if (Number(appointment.doctor_id) !== doctor_id) {
          return res.status(400).json({
            success: false,
            message:
              "Selected doctor does not belong to this appointment.",
          });
        }

        insertRecord(appointmentId);
      }
    );
  }

  // -----------------------------------------------------
  // Insert record
  // -----------------------------------------------------

  function insertRecord(validAppointmentId) {
    const sql = `
      INSERT INTO medical_records
      (
        patient_id,
        doctor_id,
        appointment_id,
        diagnosis,
        symptoms,
        treatment,
        notes,
        record_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      patient_id,
      doctor_id,
      validAppointmentId,
      String(diagnosis).trim(),
      symptoms ? String(symptoms).trim() : "",
      treatment ? String(treatment).trim() : "",
      notes ? String(notes).trim() : "",
      record_date,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(
          "❌ Error adding medical record:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Failed to add medical record",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Medical record added successfully!",
        recordId: result.insertId,
      });
    });
  }
});

// =====================================================
// UPDATE MEDICAL RECORD
// ADMIN + DOCTOR
//
// Admin:
// -> Full update
//
// Doctor:
// -> Only own record
// -> Cannot change patient
// -> Cannot change doctor
// -> Cannot use cancelled appointment
// =====================================================

router.put("/:id", (req, res) => {
  const recordId = Number(req.params.id);
  const { id, role } = req.user;

  if (!Number.isInteger(recordId) || recordId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid medical record ID.",
    });
  }

  if (role !== "admin" && role !== "doctor") {
    return res.status(403).json({
      success: false,
      message:
        "You do not have permission to update medical records.",
    });
  }

  let {
    patient_id,
    doctor_id,
    appointment_id,
    diagnosis,
    symptoms,
    treatment,
    notes,
    record_date,
  } = req.body;

  patient_id = Number(patient_id);
  doctor_id = Number(doctor_id);

  if (
    !Number.isInteger(patient_id) ||
    patient_id <= 0 ||
    !Number.isInteger(doctor_id) ||
    doctor_id <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid patient and doctor are required.",
    });
  }

  if (
    !diagnosis ||
    !String(diagnosis).trim() ||
    !record_date
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Patient, doctor, diagnosis and record date are required.",
    });
  }

  // -----------------------------------------------------
  // Find existing record
  // -----------------------------------------------------

  db.query(
    `
      SELECT
        id,
        patient_id,
        doctor_id,
        appointment_id
      FROM medical_records
      WHERE id = ?
      LIMIT 1
    `,
    [recordId],
    (findErr, results) => {
      if (findErr) {
        console.error(
          "❌ Error finding medical record:",
          findErr
        );

        return res.status(500).json({
          success: false,
          message: "Failed to find medical record.",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Medical record not found.",
        });
      }

      const existingRecord = results[0];

      // -------------------------------------------------
      // DOCTOR OWNERSHIP
      // -------------------------------------------------

      if (role === "doctor") {
        db.query(
          `
            SELECT id
            FROM doctors
            WHERE id = ?
              AND user_id = ?
            LIMIT 1
          `,
          [existingRecord.doctor_id, id],
          (doctorErr, doctorResults) => {
            if (doctorErr) {
              console.error(
                "❌ Doctor ownership verification error:",
                doctorErr
              );

              return res.status(500).json({
                success: false,
                message: "Failed to verify doctor.",
              });
            }

            if (doctorResults.length === 0) {
              return res.status(403).json({
                success: false,
                message:
                  "You can only update your own medical records.",
              });
            }

            // Doctor cannot change patient/doctor
            patient_id = Number(existingRecord.patient_id);
            doctor_id = Number(existingRecord.doctor_id);

            verifyAppointmentAndUpdate();
          }
        );

        return;
      }

      // -------------------------------------------------
      // ADMIN -> FULL ACCESS
      // -------------------------------------------------

      verifyAdminData();
    }
  );

  // -----------------------------------------------------
  // Admin verification
  // -----------------------------------------------------

  function verifyAdminData() {
    db.query(
      `
        SELECT id
        FROM patients
        WHERE id = ?
        LIMIT 1
      `,
      [patient_id],
      (patientErr, patientResults) => {
        if (patientErr) {
          console.error(
            "❌ Patient verification error:",
            patientErr
          );

          return res.status(500).json({
            success: false,
            message: "Failed to verify patient.",
          });
        }

        if (patientResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Patient not found.",
          });
        }

        db.query(
          `
            SELECT id
            FROM doctors
            WHERE id = ?
            LIMIT 1
          `,
          [doctor_id],
          (doctorErr, doctorResults) => {
            if (doctorErr) {
              console.error(
                "❌ Doctor verification error:",
                doctorErr
              );

              return res.status(500).json({
                success: false,
                message: "Failed to verify doctor.",
              });
            }

            if (doctorResults.length === 0) {
              return res.status(404).json({
                success: false,
                message: "Doctor not found.",
              });
            }

            verifyAppointmentAndUpdate();
          }
        );
      }
    );
  }

  // -----------------------------------------------------
  // Appointment verification for update
  // -----------------------------------------------------

  function verifyAppointmentAndUpdate() {
    if (
      appointment_id === undefined ||
      appointment_id === null ||
      String(appointment_id).trim() === ""
    ) {
      return updateRecord(null);
    }

    const appointmentId = Number(appointment_id);

    if (
      !Number.isInteger(appointmentId) ||
      appointmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    db.query(
      `
        SELECT
          id,
          patient_id,
          doctor_id,
          status
        FROM appointments
        WHERE id = ?
        LIMIT 1
      `,
      [appointmentId],
      (appointmentErr, appointmentResults) => {
        if (appointmentErr) {
          console.error(
            "❌ Appointment verification error:",
            appointmentErr
          );

          return res.status(500).json({
            success: false,
            message: "Failed to verify appointment.",
          });
        }

        if (appointmentResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Appointment not found.",
          });
        }

        const appointment = appointmentResults[0];

        // Doctor blocked, Admin allowed
        if (
          role === "doctor" &&
          String(appointment.status || "").toLowerCase() ===
            "cancelled"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Medical record cannot use a cancelled appointment.",
          });
        }

        if (Number(appointment.patient_id) !== patient_id) {
          return res.status(400).json({
            success: false,
            message:
              "Selected patient does not belong to this appointment.",
          });
        }

        if (Number(appointment.doctor_id) !== doctor_id) {
          return res.status(400).json({
            success: false,
            message:
              "Selected doctor does not belong to this appointment.",
          });
        }

        updateRecord(appointmentId);
      }
    );
  }

  // -----------------------------------------------------
  // Update record
  // -----------------------------------------------------

  function updateRecord(validAppointmentId) {
    const sql = `
      UPDATE medical_records
      SET
        patient_id = ?,
        doctor_id = ?,
        appointment_id = ?,
        diagnosis = ?,
        symptoms = ?,
        treatment = ?,
        notes = ?,
        record_date = ?
      WHERE id = ?
    `;

    const values = [
      patient_id,
      doctor_id,
      validAppointmentId,
      String(diagnosis).trim(),
      symptoms ? String(symptoms).trim() : "",
      treatment ? String(treatment).trim() : "",
      notes ? String(notes).trim() : "",
      record_date,
      recordId,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(
          "❌ Error updating medical record:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Failed to update medical record",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Medical record not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Medical record updated successfully!",
      });
    });
  }
});

// =====================================================
// DELETE MEDICAL RECORD
// ADMIN ONLY
// =====================================================

router.delete("/:id", (req, res) => {
  const { role } = req.user;
  const recordId = Number(req.params.id);

  if (role !== "admin") {
    return res.status(403).json({
      success: false,
      message:
        "Only admin can delete medical records.",
    });
  }

  if (!Number.isInteger(recordId) || recordId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid medical record ID.",
    });
  }

  db.query(
    `
      DELETE FROM medical_records
      WHERE id = ?
    `,
    [recordId],
    (err, result) => {
      if (err) {
        console.error(
          "❌ Error deleting medical record:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Failed to delete medical record",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Medical record not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Medical record deleted successfully!",
      });
    }
  );
});

module.exports = router;