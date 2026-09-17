const express = require("express");
const router = express.Router();

const db = require("../db");
const authenticateToken = require("../authMiddleware");
const allowRoles = require("../roleMiddleware");

// =====================================================
// GET ALL PRESCRIPTIONS
// Admin   -> All prescriptions
// Doctor  -> Only own prescriptions
// Patient -> Only own prescriptions
// =====================================================

router.get(
  "/",
  authenticateToken,
  allowRoles("admin", "doctor", "patient"),
  (req, res) => {
    let query = `
      SELECT
        p.id,
        p.appointment_id,
        p.patient_id,
        p.doctor_id,
        p.diagnosis,
        p.medicines,
        p.instructions,
        p.created_at,

        pt.patient_code,

        u_patient.name AS patient_name,
        u_doctor.name AS doctor_name,

        d.department,
        d.specialization

      FROM prescriptions p

      INNER JOIN patients pt
        ON p.patient_id = pt.id

      INNER JOIN users u_patient
        ON pt.user_id = u_patient.id

      INNER JOIN doctors d
        ON p.doctor_id = d.id

      INNER JOIN users u_doctor
        ON d.user_id = u_doctor.id
    `;

    const params = [];

    // Doctor -> only his prescriptions
    if (req.user.role === "doctor") {
      query += ` WHERE d.user_id = ? `;
      params.push(req.user.id);
    }

    // Patient -> only his prescriptions
    else if (req.user.role === "patient") {
      query += ` WHERE pt.user_id = ? `;
      params.push(req.user.id);
    }

    query += ` ORDER BY p.created_at DESC `;

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("❌ Error fetching prescriptions:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to fetch prescriptions",
        });
      }

      return res.json({
        success: true,
        prescriptions: results,
      });
    });
  }
);

// =====================================================
// GET SINGLE PRESCRIPTION
// =====================================================

router.get(
  "/:id",
  authenticateToken,
  allowRoles("admin", "doctor", "patient"),
  (req, res) => {
    const prescriptionId = Number(req.params.id);

    if (!Number.isInteger(prescriptionId) || prescriptionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID",
      });
    }

    const query = `
      SELECT
        p.id,
        p.appointment_id,
        p.patient_id,
        p.doctor_id,
        p.diagnosis,
        p.medicines,
        p.instructions,
        p.created_at,

        pt.patient_code,

        u_patient.name AS patient_name,
        u_doctor.name AS doctor_name,

        d.department,
        d.specialization

      FROM prescriptions p

      INNER JOIN patients pt
        ON p.patient_id = pt.id

      INNER JOIN users u_patient
        ON pt.user_id = u_patient.id

      INNER JOIN doctors d
        ON p.doctor_id = d.id

      INNER JOIN users u_doctor
        ON d.user_id = u_doctor.id

      WHERE p.id = ?
      LIMIT 1
    `;

    db.query(query, [prescriptionId], (err, results) => {
      if (err) {
        console.error("❌ Error fetching prescription:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to fetch prescription",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }

      const prescription = results[0];

      // =================================================
      // ADMIN -> FULL ACCESS
      // =================================================

      if (req.user.role === "admin") {
        return res.json({
          success: true,
          prescription,
        });
      }

      // =================================================
      // DOCTOR -> ONLY OWN PRESCRIPTION
      // =================================================

      if (req.user.role === "doctor") {
        const doctorQuery = `
          SELECT id
          FROM doctors
          WHERE id = ?
            AND user_id = ?
          LIMIT 1
        `;

        return db.query(
          doctorQuery,
          [prescription.doctor_id, req.user.id],
          (doctorErr, doctorResults) => {
            if (doctorErr) {
              console.error(
                "❌ Error verifying doctor:",
                doctorErr
              );

              return res.status(500).json({
                success: false,
                message: "Failed to verify doctor",
              });
            }

            if (doctorResults.length === 0) {
              return res.status(403).json({
                success: false,
                message: "Access denied",
              });
            }

            return res.json({
              success: true,
              prescription,
            });
          }
        );
      }

      // =================================================
      // PATIENT -> ONLY OWN PRESCRIPTION
      // =================================================

      if (req.user.role === "patient") {
        const patientQuery = `
          SELECT id
          FROM patients
          WHERE id = ?
            AND user_id = ?
          LIMIT 1
        `;

        return db.query(
          patientQuery,
          [prescription.patient_id, req.user.id],
          (patientErr, patientResults) => {
            if (patientErr) {
              console.error(
                "❌ Error verifying patient:",
                patientErr
              );

              return res.status(500).json({
                success: false,
                message: "Failed to verify patient",
              });
            }

            if (patientResults.length === 0) {
              return res.status(403).json({
                success: false,
                message: "Access denied",
              });
            }

            return res.json({
              success: true,
              prescription,
            });
          }
        );
      }

      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    });
  }
);

// =====================================================
// CREATE PRESCRIPTION
// Admin + Doctor
//
// Security:
// 1. Appointment must exist
// 2. Appointment cannot be cancelled
// 3. Patient must match appointment
// 4. Doctor must match appointment
// 5. Doctor can only create for own appointment
// 6. Same appointment cannot have duplicate prescription
// =====================================================

router.post(
  "/",
  authenticateToken,
  allowRoles("admin", "doctor"),
  (req, res) => {
    const {
      appointment_id,
      patient_id,
      doctor_id,
      diagnosis,
      medicines,
      instructions,
    } = req.body;

    // -------------------------------------------------
    // Basic validation
    // -------------------------------------------------

    if (!appointment_id || !patient_id || !doctor_id || !medicines) {
      return res.status(400).json({
        success: false,
        message:
          "Appointment, patient, doctor and medicines are required",
      });
    }

    const appointmentId = Number(appointment_id);
    const patientId = Number(patient_id);
    const doctorId = Number(doctor_id);

    if (
      !Number.isInteger(appointmentId) ||
      appointmentId <= 0 ||
      !Number.isInteger(patientId) ||
      patientId <= 0 ||
      !Number.isInteger(doctorId) ||
      doctorId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment, patient or doctor ID",
      });
    }

    // -------------------------------------------------
    // Medicines validation
    // -------------------------------------------------

    let medicinesData;

    try {
      if (typeof medicines === "string") {
        medicinesData = medicines.trim();

        if (!medicinesData) {
          return res.status(400).json({
            success: false,
            message: "Medicines cannot be empty",
          });
        }
      } else {
        medicinesData = JSON.stringify(medicines);

        if (!medicinesData || medicinesData === "null") {
          return res.status(400).json({
            success: false,
            message: "Invalid medicines data",
          });
        }
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicines data",
      });
    }

    // -------------------------------------------------
    // Verify appointment
    // -------------------------------------------------

    const appointmentQuery = `
      SELECT
        id,
        patient_id,
        doctor_id,
        status,
        appointment_date,
        appointment_time
      FROM appointments
      WHERE id = ?
      LIMIT 1
    `;

    db.query(
      appointmentQuery,
      [appointmentId],
      (appointmentErr, appointmentResults) => {
        if (appointmentErr) {
          console.error(
            "❌ Error checking appointment:",
            appointmentErr
          );

          return res.status(500).json({
            success: false,
            message: "Failed to verify appointment",
          });
        }

        if (appointmentResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Appointment not found",
          });
        }

        const appointment = appointmentResults[0];

        // -------------------------------------------------
        // Cancelled appointment -> block prescription
        // -------------------------------------------------

        if (
          String(appointment.status || "").toLowerCase() ===
          "cancelled"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Prescription cannot be created for a cancelled appointment",
          });
        }

        // -------------------------------------------------
        // Patient must match appointment
        // -------------------------------------------------

        if (Number(appointment.patient_id) !== patientId) {
          return res.status(400).json({
            success: false,
            message:
              "Selected patient does not belong to this appointment",
          });
        }

        // -------------------------------------------------
        // Doctor must match appointment
        // -------------------------------------------------

        if (Number(appointment.doctor_id) !== doctorId) {
          return res.status(400).json({
            success: false,
            message:
              "Selected doctor does not belong to this appointment",
          });
        }

        // -------------------------------------------------
        // Doctor -> only own appointment
        // -------------------------------------------------

        if (req.user.role === "doctor") {
          const doctorCheckQuery = `
            SELECT id
            FROM doctors
            WHERE id = ?
              AND user_id = ?
            LIMIT 1
          `;

          return db.query(
            doctorCheckQuery,
            [doctorId, req.user.id],
            (doctorErr, doctorResults) => {
              if (doctorErr) {
                console.error(
                  "❌ Error checking doctor:",
                  doctorErr
                );

                return res.status(500).json({
                  success: false,
                  message: "Failed to verify doctor",
                });
              }

              if (doctorResults.length === 0) {
                return res.status(403).json({
                  success: false,
                  message:
                    "You can create prescriptions only for your own patients",
                });
              }

              checkDuplicatePrescription();
            }
          );
        }

        checkDuplicatePrescription();

        // -------------------------------------------------
        // Check duplicate prescription
        // -------------------------------------------------

        function checkDuplicatePrescription() {
          const duplicateQuery = `
            SELECT id
            FROM prescriptions
            WHERE appointment_id = ?
            LIMIT 1
          `;

          db.query(
            duplicateQuery,
            [appointmentId],
            (duplicateErr, duplicateResults) => {
              if (duplicateErr) {
                console.error(
                  "❌ Error checking duplicate prescription:",
                  duplicateErr
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to check existing prescription",
                });
              }

              if (duplicateResults.length > 0) {
                return res.status(409).json({
                  success: false,
                  message:
                    "A prescription already exists for this appointment",
                });
              }

              createPrescription();
            }
          );
        }

        // -------------------------------------------------
        // Insert prescription
        // -------------------------------------------------

        function createPrescription() {
          const insertQuery = `
            INSERT INTO prescriptions
            (
              appointment_id,
              patient_id,
              doctor_id,
              diagnosis,
              medicines,
              instructions
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          db.query(
            insertQuery,
            [
              appointmentId,
              patientId,
              doctorId,
              diagnosis
                ? String(diagnosis).trim()
                : null,
              medicinesData,
              instructions
                ? String(instructions).trim()
                : null,
            ],
            (insertErr, result) => {
              if (insertErr) {
                console.error(
                  "❌ Error creating prescription:",
                  insertErr
                );

                return res.status(500).json({
                  success: false,
                  message: "Failed to create prescription",
                });
              }

              return res.status(201).json({
                success: true,
                message: "Prescription created successfully",
                prescription_id: result.insertId,
              });
            }
          );
        }
      }
    );
  }
);

// =====================================================
// UPDATE PRESCRIPTION
// Admin + Doctor
//
// Admin -> can update any prescription
// Doctor -> can update only own prescription
//
// Frontend cannot change patient/doctor/appointment
// Doctor ownership is verified from database.
// =====================================================

router.put(
  "/:id",
  authenticateToken,
  allowRoles("admin", "doctor"),
  (req, res) => {
    const prescriptionId = Number(req.params.id);

    if (
      !Number.isInteger(prescriptionId) ||
      prescriptionId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID",
      });
    }

    const {
      diagnosis,
      medicines,
      instructions,
    } = req.body;

    // -------------------------------------------------
    // Medicines required
    // -------------------------------------------------

    if (
      medicines === undefined ||
      medicines === null ||
      (typeof medicines === "string" &&
        !medicines.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Medicines are required",
      });
    }

    // -------------------------------------------------
    // Convert medicines
    // -------------------------------------------------

    let medicinesData;

    try {
      if (typeof medicines === "string") {
        medicinesData = medicines.trim();
      } else {
        medicinesData = JSON.stringify(medicines);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicines data",
      });
    }

    if (!medicinesData) {
      return res.status(400).json({
        success: false,
        message: "Medicines cannot be empty",
      });
    }

    // -------------------------------------------------
    // Find prescription
    // -------------------------------------------------

    const findQuery = `
      SELECT
        id,
        appointment_id,
        patient_id,
        doctor_id
      FROM prescriptions
      WHERE id = ?
      LIMIT 1
    `;

    db.query(
      findQuery,
      [prescriptionId],
      (findErr, findResults) => {
        if (findErr) {
          console.error(
            "❌ Error finding prescription:",
            findErr
          );

          return res.status(500).json({
            success: false,
            message: "Failed to find prescription",
          });
        }

        if (findResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Prescription not found",
          });
        }

        const prescription = findResults[0];

        // -------------------------------------------------
        // Doctor -> only own prescription
        // -------------------------------------------------

        if (req.user.role === "doctor") {
          const doctorCheckQuery = `
            SELECT id
            FROM doctors
            WHERE id = ?
              AND user_id = ?
            LIMIT 1
          `;

          return db.query(
            doctorCheckQuery,
            [prescription.doctor_id, req.user.id],
            (doctorErr, doctorResults) => {
              if (doctorErr) {
                console.error(
                  "❌ Error verifying doctor:",
                  doctorErr
                );

                return res.status(500).json({
                  success: false,
                  message: "Failed to verify doctor",
                });
              }

              if (doctorResults.length === 0) {
                return res.status(403).json({
                  success: false,
                  message:
                    "You can edit only your own prescriptions",
                });
              }

              updatePrescription();
            }
          );
        }

        // Admin can directly update
        updatePrescription();

        // -------------------------------------------------
        // Update prescription
        // -------------------------------------------------

        function updatePrescription() {
          const updateQuery = `
            UPDATE prescriptions
            SET
              diagnosis = ?,
              medicines = ?,
              instructions = ?
            WHERE id = ?
          `;

          db.query(
            updateQuery,
            [
              diagnosis
                ? String(diagnosis).trim()
                : null,
              medicinesData,
              instructions
                ? String(instructions).trim()
                : null,
              prescriptionId,
            ],
            (updateErr, result) => {
              if (updateErr) {
                console.error(
                  "❌ Error updating prescription:",
                  updateErr
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to update prescription",
                });
              }

              if (result.affectedRows === 0) {
                return res.status(404).json({
                  success: false,
                  message: "Prescription not found",
                });
              }

              return res.json({
                success: true,
                message:
                  "Prescription updated successfully",
              });
            }
          );
        }
      }
    );
  }
);

// =====================================================
// DELETE PRESCRIPTION
// Admin ONLY
// =====================================================

router.delete(
  "/:id",
  authenticateToken,
  allowRoles("admin"),
  (req, res) => {
    const prescriptionId = Number(req.params.id);

    if (
      !Number.isInteger(prescriptionId) ||
      prescriptionId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID",
      });
    }

    const deleteQuery = `
      DELETE FROM prescriptions
      WHERE id = ?
    `;

    db.query(
      deleteQuery,
      [prescriptionId],
      (err, result) => {
        if (err) {
          console.error(
            "❌ Error deleting prescription:",
            err
          );

          return res.status(500).json({
            success: false,
            message: "Failed to delete prescription",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Prescription not found",
          });
        }

        return res.json({
          success: true,
          message: "Prescription deleted successfully",
        });
      }
    );
  }
);

module.exports = router;