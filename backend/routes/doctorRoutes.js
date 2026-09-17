const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();
const db = require("../db");


// =====================================================
// GET ALL DOCTORS
// =====================================================
// Admin  → All doctors
// Doctor → All doctors
// Patient → All doctors
//
// Patient needs this because patient has to select
// a doctor while booking an appointment.
// =====================================================

router.get("/", (req, res) => {

  // Admin + Doctor + Patient can view doctors
  if (
    req.user.role !== "admin" &&
    req.user.role !== "doctor" &&
    req.user.role !== "patient"
  ) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You cannot view doctors.",
    });
  }

  const sql = `
    SELECT
      d.id,
      d.user_id,
      u.name,
      u.email,
      d.department,
      d.specialization,
      d.qualification,
      d.experience_years,
      d.phone,
      d.consultation_fee,
      d.created_at
    FROM doctors d
    INNER JOIN users u ON d.user_id = u.id
    ORDER BY d.id DESC
  `;

  db.query(sql, (err, results) => {

    if (err) {
      console.error("Get all doctors error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch doctors",
      });
    }

    return res.json({
      success: true,
      doctors: results,
    });
  });
});


// =====================================================
// GET SINGLE DOCTOR
// =====================================================
// Admin  → Can view
// Doctor → Can view
// Patient → Can view
// =====================================================

router.get("/:id", (req, res) => {

  if (
    req.user.role !== "admin" &&
    req.user.role !== "doctor" &&
    req.user.role !== "patient"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. You cannot view doctor details.",
    });
  }

  const doctorId = req.params.id;

  const sql = `
    SELECT
      d.id,
      d.user_id,
      u.name,
      u.email,
      d.department,
      d.specialization,
      d.qualification,
      d.experience_years,
      d.phone,
      d.consultation_fee,
      d.created_at
    FROM doctors d
    INNER JOIN users u ON d.user_id = u.id
    WHERE d.id = ?
  `;

  db.query(sql, [doctorId], (err, results) => {

    if (err) {
      console.error(
        "Get single doctor error:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch doctor",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.json({
      success: true,
      doctor: results[0],
    });
  });
});


// =====================================================
// CREATE DOCTOR
// =====================================================
// Admin only
// =====================================================

router.post("/", (req, res) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only admin can create doctors.",
    });
  }

  const {
    name,
    email,
    password,
    department,
    specialization,
    qualification,
    experience_years,
    phone,
    consultation_fee,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message:
        "Name, email and password are required",
    });
  }

  // ---------------------------------------------------
  // CHECK EMAIL
  // ---------------------------------------------------

  const checkSql = `
    SELECT id
    FROM users
    WHERE email = ?
  `;

  db.query(
    checkSql,
    [email],
    (err, users) => {

      if (err) {
        console.error(
          "Check doctor email error:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (users.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      // ---------------------------------------------------
      // HASH PASSWORD
      // ---------------------------------------------------

      bcrypt.hash(
        password,
        10,
        (hashError, hashedPassword) => {

          if (hashError) {
            console.error(
              "Doctor password hash error:",
              hashError
            );

            return res.status(500).json({
              success: false,
              message:
                "Failed to secure password",
            });
          }

          // ---------------------------------------------------
          // CREATE USER
          // ---------------------------------------------------

          const userSql = `
            INSERT INTO users
            (name, email, password, role)
            VALUES (?, ?, ?, 'doctor')
          `;

          db.query(
            userSql,
            [
              name,
              email,
              hashedPassword,
            ],
            (userError, userResult) => {

              if (userError) {
                console.error(
                  "Create doctor user error:",
                  userError
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to create doctor",
                });
              }

              // ---------------------------------------------------
              // CREATE DOCTOR PROFILE
              // ---------------------------------------------------

              const doctorSql = `
                INSERT INTO doctors
                (
                  user_id,
                  department,
                  specialization,
                  qualification,
                  experience_years,
                  phone,
                  consultation_fee
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `;

              db.query(
                doctorSql,
                [
                  userResult.insertId,
                  department || null,
                  specialization || null,
                  qualification || null,
                  experience_years || 0,
                  phone || null,
                  consultation_fee || 0,
                ],
                (doctorError, doctorResult) => {

                  if (doctorError) {
                    console.error(
                      "Create doctor profile error:",
                      doctorError
                    );

                    // Remove user if profile creation fails
                    db.query(
                      "DELETE FROM users WHERE id = ?",
                      [userResult.insertId],
                      () => {}
                    );

                    return res.status(500).json({
                      success: false,
                      message:
                        "Failed to create doctor profile",
                    });
                  }

                  return res.status(201).json({
                    success: true,
                    message:
                      "Doctor registered successfully",
                    doctorId:
                      doctorResult.insertId,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});


// =====================================================
// UPDATE DOCTOR
// =====================================================
// Admin only
// =====================================================

router.put("/:id", (req, res) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only admin can update doctors.",
    });
  }

  const doctorId = req.params.id;

  const {
    name,
    email,
    department,
    specialization,
    qualification,
    experience_years,
    phone,
    consultation_fee,
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: "Name and email are required",
    });
  }

  // ---------------------------------------------------
  // FIND DOCTOR
  // ---------------------------------------------------

  const findSql = `
    SELECT user_id
    FROM doctors
    WHERE id = ?
  `;

  db.query(
    findSql,
    [doctorId],
    (err, results) => {

      if (err) {
        console.error(
          "Find doctor for update error:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const userId = results[0].user_id;

      // ---------------------------------------------------
      // UPDATE USER
      // ---------------------------------------------------

      const userSql = `
        UPDATE users
        SET name = ?, email = ?
        WHERE id = ?
      `;

      db.query(
        userSql,
        [
          name,
          email,
          userId,
        ],
        (userError) => {

          if (userError) {
            console.error(
              "Update doctor account error:",
              userError
            );

            if (
              userError.code ===
              "ER_DUP_ENTRY"
            ) {
              return res.status(409).json({
                success: false,
                message:
                  "Email already registered",
              });
            }

            return res.status(500).json({
              success: false,
              message:
                "Failed to update doctor account",
            });
          }

          // ---------------------------------------------------
          // UPDATE DOCTOR PROFILE
          // ---------------------------------------------------

          const doctorSql = `
            UPDATE doctors
            SET
              department = ?,
              specialization = ?,
              qualification = ?,
              experience_years = ?,
              phone = ?,
              consultation_fee = ?
            WHERE id = ?
          `;

          db.query(
            doctorSql,
            [
              department || null,
              specialization || null,
              qualification || null,
              experience_years || 0,
              phone || null,
              consultation_fee || 0,
              doctorId,
            ],
            (doctorError) => {

              if (doctorError) {
                console.error(
                  "Update doctor profile error:",
                  doctorError
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to update doctor profile",
                });
              }

              return res.json({
                success: true,
                message:
                  "Doctor updated successfully",
              });
            }
          );
        }
      );
    }
  );
});


// =====================================================
// DELETE DOCTOR
// =====================================================
// Admin only
// =====================================================

router.delete("/:id", (req, res) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only admin can delete doctors.",
    });
  }

  const doctorId = req.params.id;

  // ---------------------------------------------------
  // FIND DOCTOR USER ID
  // ---------------------------------------------------

  const findSql = `
    SELECT user_id
    FROM doctors
    WHERE id = ?
  `;

  db.query(
    findSql,
    [doctorId],
    (err, results) => {

      if (err) {
        console.error(
          "Find doctor for delete error:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const userId = results[0].user_id;

      // ---------------------------------------------------
      // DELETE DOCTOR PROFILE
      // ---------------------------------------------------

      const deleteDoctorSql = `
        DELETE FROM doctors
        WHERE id = ?
      `;

      db.query(
        deleteDoctorSql,
        [doctorId],
        (doctorError) => {

          if (doctorError) {
            console.error(
              "Delete doctor profile error:",
              doctorError
            );

            return res.status(500).json({
              success: false,
              message:
                "Cannot delete doctor. Doctor may have related appointments or records.",
            });
          }

          // ---------------------------------------------------
          // DELETE USER
          // ---------------------------------------------------

          const deleteUserSql = `
            DELETE FROM users
            WHERE id = ?
          `;

          db.query(
            deleteUserSql,
            [userId],
            (userError) => {

              if (userError) {
                console.error(
                  "Delete doctor user error:",
                  userError
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Doctor profile deleted but user deletion failed",
                });
              }

              return res.json({
                success: true,
                message:
                  "Doctor deleted successfully",
              });
            }
          );
        }
      );
    }
  );
});


module.exports = router;