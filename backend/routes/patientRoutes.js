const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();
const db = require("../db");
const authenticateToken = require("../authMiddleware");

// =====================================================
// GET ALL PATIENTS / SEARCH PATIENTS
// =====================================================

router.get("/", authenticateToken, (req, res) => {
  const search = (req.query.search || "").trim();

  // =====================================================
  // PATIENT CAN SEE ONLY OWN RECORD
  // =====================================================

  if (req.user.role === "patient") {
    const sql = `
      SELECT
        p.id,
        p.patient_code,
        p.user_id,
        u.name,
        u.email,
        p.phone,
        p.date_of_birth,
        p.gender,
        p.blood_group,
        p.address,
        p.emergency_contact,
        p.created_at
      FROM patients p
      INNER JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.id DESC
    `;

    db.query(sql, [req.user.id], (err, results) => {
      if (err) {
        console.error("Get patient error:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to load patient.",
        });
      }

      return res.json({
        success: true,
        patients: results,
      });
    });

    return;
  }

  // =====================================================
  // ADMIN / DOCTOR SEARCH
  // =====================================================

  let sql = `
    SELECT
      p.id,
      p.patient_code,
      p.user_id,
      u.name,
      u.email,
      p.phone,
      p.date_of_birth,
      p.gender,
      p.blood_group,
      p.address,
      p.emergency_contact,
      p.created_at
    FROM patients p
    INNER JOIN users u ON p.user_id = u.id
  `;

  const params = [];

  if (search) {
    sql += `
      WHERE
        p.patient_code LIKE ?
        OR u.name LIKE ?
        OR p.phone LIKE ?
    `;

    const searchValue = `%${search}%`;

    params.push(
      searchValue,
      searchValue,
      searchValue
    );
  }

  sql += ` ORDER BY p.id DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(
        "Get/search patients error:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to load patients.",
      });
    }

    return res.json({
      success: true,
      patients: results,
    });
  });
});

// =====================================================
// GET SINGLE PATIENT
// =====================================================

router.get("/:id", authenticateToken, (req, res) => {
  const patientId = Number(req.params.id);

  if (!patientId || Number.isNaN(patientId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID.",
    });
  }

  const sql = `
    SELECT
      p.id,
      p.patient_code,
      p.user_id,
      u.name,
      u.email,
      p.phone,
      p.date_of_birth,
      p.gender,
      p.blood_group,
      p.address,
      p.emergency_contact,
      p.created_at
    FROM patients p
    INNER JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      console.error(
        "Get single patient error:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to load patient.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const patient = results[0];

    // Patient can only see own record
    if (
      req.user.role === "patient" &&
      Number(patient.user_id) !== Number(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view this patient.",
      });
    }

    return res.json({
      success: true,
      patient,
    });
  });
});

// =====================================================
// ADD PATIENT
// ADMIN ONLY
// =====================================================

router.post("/", authenticateToken, async (req, res) => {
  // Only admin can add patients
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can add patients.",
    });
  }

  const {
    name,
    email,
    password,
    phone,
    date_of_birth,
    gender,
    blood_group,
    address,
    emergency_contact,
  } = req.body;

  // =====================================================
  // VALIDATION
  // =====================================================

  if (
    !name ||
    !email ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Name, email and password are required.",
    });
  }

  const cleanName = String(name).trim();
  const cleanEmail = String(email)
    .trim()
    .toLowerCase();

  if (cleanName.length < 2) {
    return res.status(400).json({
      success: false,
      message:
        "Patient name must contain at least 2 characters.",
    });
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      message:
        "Please enter a valid email address.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 6 characters.",
    });
  }

  try {
    // =====================================================
    // CHECK EMAIL
    // =====================================================

    db.query(
      `
        SELECT id
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [cleanEmail],
      async (checkErr, existingUsers) => {
        if (checkErr) {
          console.error(
            "Check patient email error:",
            checkErr
          );

          return res.status(500).json({
            success: false,
            message: "Database error.",
          });
        }

        if (existingUsers.length > 0) {
          return res.status(409).json({
            success: false,
            message:
              "Email already exists.",
          });
        }

        // =====================================================
        // HASH PASSWORD
        // =====================================================

        const hashedPassword =
          await bcrypt.hash(password, 10);

        // =====================================================
        // CREATE USER
        // =====================================================

        const userSql = `
          INSERT INTO users
          (
            name,
            email,
            password,
            role
          )
          VALUES (?, ?, ?, 'patient')
        `;

        db.query(
          userSql,
          [
            cleanName,
            cleanEmail,
            hashedPassword,
          ],
          (userErr, userResult) => {
            if (userErr) {
              console.error(
                "Create patient user error:",
                userErr
              );

              if (
                userErr.code ===
                "ER_DUP_ENTRY"
              ) {
                return res.status(409).json({
                  success: false,
                  message:
                    "Email already exists.",
                });
              }

              return res.status(500).json({
                success: false,
                message:
                  "Failed to create patient account.",
              });
            }

            const userId =
              userResult.insertId;

            // =====================================================
            // CREATE PATIENT PROFILE
            // =====================================================

            const patientSql = `
              INSERT INTO patients
              (
                user_id,
                phone,
                date_of_birth,
                gender,
                blood_group,
                address,
                emergency_contact
              )
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
              patientSql,
              [
                userId,
                phone || null,
                date_of_birth || null,
                gender || null,
                blood_group || null,
                address || null,
                emergency_contact || null,
              ],
              (patientErr, patientResult) => {
                if (patientErr) {
                  console.error(
                    "Create patient profile error:",
                    patientErr
                  );

                  // Remove user if patient profile fails
                  db.query(
                    "DELETE FROM users WHERE id = ?",
                    [userId]
                  );

                  return res.status(500).json({
                    success: false,
                    message:
                      "Failed to create patient profile.",
                  });
                }

                const patientId =
                  patientResult.insertId;

                // =====================================================
                // GENERATE UHID
                // =====================================================

                const patientCode =
                  `HOSP-${String(
                    patientId
                  ).padStart(6, "0")}`;

                const updateCodeSql = `
                  UPDATE patients
                  SET patient_code = ?
                  WHERE id = ?
                `;

                db.query(
                  updateCodeSql,
                  [
                    patientCode,
                    patientId,
                  ],
                  (codeErr) => {
                    if (codeErr) {
                      console.error(
                        "Generate UHID error:",
                        codeErr
                      );

                      return res.status(500).json({
                        success: false,
                        message:
                          "Patient created but UHID generation failed.",
                      });
                    }

                    // =====================================================
                    // SUCCESS
                    // =====================================================

                    return res.status(201).json({
                      success: true,
                      message:
                        "Patient created successfully.",
                      patientId,
                      patient_code:
                        patientCode,
                      patient: {
                        id: patientId,
                        patient_code:
                          patientCode,
                        user_id: userId,
                        name: cleanName,
                        email: cleanEmail,
                        phone:
                          phone || null,
                        date_of_birth:
                          date_of_birth || null,
                        gender:
                          gender || null,
                        blood_group:
                          blood_group || null,
                        address:
                          address || null,
                        emergency_contact:
                          emergency_contact || null,
                      },
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error(
      "Create patient error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create patient.",
    });
  }
});

// =====================================================
// DELETE PATIENT
// ADMIN ONLY
// =====================================================

router.delete(
  "/:id",
  authenticateToken,
  (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only admin can delete patients.",
      });
    }

    const patientId = Number(req.params.id);

    if (!patientId || Number.isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID.",
      });
    }

    const findUserSql = `
      SELECT
        p.user_id,
        u.name,
        u.email
      FROM patients p
      INNER JOIN users u
        ON p.user_id = u.id
      WHERE p.id = ?
      LIMIT 1
    `;

    db.query(
      findUserSql,
      [patientId],
      (findErr, results) => {
        if (findErr) {
          console.error(
            "Find patient user error:",
            findErr
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to find patient.",
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message:
              "Patient not found.",
          });
        }

        const userId =
          results[0].user_id;

        const patientName =
          results[0].name;

        // =====================================================
        // DELETE PATIENT PROFILE
        // =====================================================

        db.query(
          "DELETE FROM patients WHERE id = ?",
          [patientId],
          (deletePatientErr) => {
            if (deletePatientErr) {
              console.error(
                "Delete patient error:",
                deletePatientErr
              );

              return res.status(500).json({
                success: false,
                message:
                  "Failed to delete patient.",
              });
            }

            // =====================================================
            // DELETE USER ACCOUNT
            // =====================================================

            db.query(
              "DELETE FROM users WHERE id = ? AND role = 'patient'",
              [userId],
              (deleteUserErr) => {
                if (deleteUserErr) {
                  console.error(
                    "Delete patient user error:",
                    deleteUserErr
                  );

                  return res.status(500).json({
                    success: false,
                    message:
                      "Patient profile deleted but user account could not be deleted.",
                  });
                }

                return res.json({
                  success: true,
                  message:
                    `Patient "${patientName}" deleted successfully.`,
                });
              }
            );
          }
        );
      }
    );
  }
);

// =====================================================
// UPDATE PATIENT
// ADMIN ONLY
// UHID WILL NOT CHANGE
// =====================================================

router.put(
  "/:id",
  authenticateToken,
  (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only admin can update patients.",
      });
    }

    const patientId = Number(req.params.id);

    if (!patientId || Number.isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID.",
      });
    }

    const {
      name,
      email,
      phone,
      date_of_birth,
      gender,
      blood_group,
      address,
      emergency_contact,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message:
          "Name and email are required.",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email)
      .trim()
      .toLowerCase();

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Patient name must contain at least 2 characters.",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    const findPatientSql = `
      SELECT
        user_id,
        patient_code
      FROM patients
      WHERE id = ?
      LIMIT 1
    `;

    db.query(
      findPatientSql,
      [patientId],
      (findErr, results) => {
        if (findErr) {
          console.error(
            "Find patient error:",
            findErr
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to find patient.",
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message:
              "Patient not found.",
          });
        }

        const userId =
          results[0].user_id;

        // =====================================================
        // CHECK EMAIL
        // =====================================================

        db.query(
          `
            SELECT id
            FROM users
            WHERE email = ?
              AND id != ?
            LIMIT 1
          `,
          [cleanEmail, userId],
          (emailErr, emailResults) => {
            if (emailErr) {
              console.error(
                "Check patient email error:",
                emailErr
              );

              return res.status(500).json({
                success: false,
                message:
                  "Database error.",
              });
            }

            if (emailResults.length > 0) {
              return res.status(409).json({
                success: false,
                message:
                  "Email already exists.",
              });
            }

            // =====================================================
            // UPDATE USER
            // =====================================================

            const updateUserSql = `
              UPDATE users
              SET
                name = ?,
                email = ?
              WHERE id = ?
                AND role = 'patient'
            `;

            db.query(
              updateUserSql,
              [
                cleanName,
                cleanEmail,
                userId,
              ],
              (userErr, userResult) => {
                if (userErr) {
                  console.error(
                    "Update patient user error:",
                    userErr
                  );

                  return res.status(500).json({
                    success: false,
                    message:
                      "Failed to update patient.",
                  });
                }

                if (
                  userResult.affectedRows === 0
                ) {
                  return res.status(404).json({
                    success: false,
                    message:
                      "Patient account not found.",
                  });
                }

                // =====================================================
                // UPDATE PATIENT PROFILE
                // =====================================================

                const updatePatientSql = `
                  UPDATE patients
                  SET
                    phone = ?,
                    date_of_birth = ?,
                    gender = ?,
                    blood_group = ?,
                    address = ?,
                    emergency_contact = ?
                  WHERE id = ?
                `;

                db.query(
                  updatePatientSql,
                  [
                    phone || null,
                    date_of_birth || null,
                    gender || null,
                    blood_group || null,
                    address || null,
                    emergency_contact || null,
                    patientId,
                  ],
                  (patientErr) => {
                    if (patientErr) {
                      console.error(
                        "Update patient profile error:",
                        patientErr
                      );

                      return res.status(500).json({
                        success: false,
                        message:
                          "Failed to update patient profile.",
                      });
                    }

                    return res.json({
                      success: true,
                      message:
                        "Patient updated successfully.",
                      patient: {
                        id: patientId,
                        patient_code:
                          results[0].patient_code,
                        user_id: userId,
                        name: cleanName,
                        email: cleanEmail,
                        phone:
                          phone || null,
                        date_of_birth:
                          date_of_birth || null,
                        gender:
                          gender || null,
                        blood_group:
                          blood_group || null,
                        address:
                          address || null,
                        emergency_contact:
                          emergency_contact || null,
                      },
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

module.exports = router;