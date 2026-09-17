const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const authenticateToken = require("../authMiddleware");

const router = express.Router();

/* =====================================================
   LOGIN
===================================================== */

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const sql = `
    SELECT id, name, email, password, role
    FROM users
    WHERE email = ?
  `;

  db.query(sql, [email.trim().toLowerCase()], async (err, results) => {
    if (err) {
      console.error("Login database error:", err);

      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = results[0];

    try {
      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      return res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login password error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  });
});

/* =====================================================
   GET PROFILE
===================================================== */

router.get(
  "/profile",
  authenticateToken,
  (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const sql = `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = ?
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error(
          "Get profile database error:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database error.",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.json({
        success: true,
        user: results[0],
      });
    });
  }
);

/* =====================================================
   UPDATE PROFILE
===================================================== */

router.put(
  "/profile",
  authenticateToken,
  (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain at least 2 characters.",
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

    db.query(
      `
        SELECT id
        FROM users
        WHERE email = ?
        AND id != ?
      `,
      [cleanEmail, userId],
      (checkErr, results) => {
        if (checkErr) {
          console.error(
            "Profile email check error:",
            checkErr
          );

          return res.status(500).json({
            success: false,
            message: "Database error.",
          });
        }

        if (results.length > 0) {
          return res.status(409).json({
            success: false,
            message:
              "This email is already registered with another account.",
          });
        }

        db.query(
          `
            UPDATE users
            SET name = ?, email = ?
            WHERE id = ?
          `,
          [cleanName, cleanEmail, userId],
          (updateErr, result) => {
            if (updateErr) {
              console.error(
                "Update profile error:",
                updateErr
              );

              return res.status(500).json({
                success: false,
                message:
                  "Failed to update profile.",
              });
            }

            if (result.affectedRows === 0) {
              return res.status(404).json({
                success: false,
                message: "User not found.",
              });
            }

            db.query(
              `
                SELECT id, name, email, role, created_at
                FROM users
                WHERE id = ?
              `,
              [userId],
              (getErr, updatedResults) => {
                if (getErr) {
                  console.error(
                    "Get updated profile error:",
                    getErr
                  );

                  return res.status(500).json({
                    success: false,
                    message:
                      "Profile updated, but failed to fetch updated data.",
                  });
                }

                return res.json({
                  success: true,
                  message:
                    "Profile updated successfully.",
                  user: updatedResults[0],
                });
              }
            );
          }
        );
      }
    );
  }
);

/* =====================================================
   CREATE NEW ADMIN
   ADMIN ONLY
===================================================== */

router.post(
  "/create-admin",
  authenticateToken,
  async (req, res) => {
    try {
      /* -----------------------------------------------
         CHECK CURRENT USER
      ------------------------------------------------ */

      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Only admin can create a new admin.",
        });
      }

      /* -----------------------------------------------
         GET FORM DATA
      ------------------------------------------------ */

      const {
        name,
        email,
        password,
        confirmPassword,
      } = req.body;

      /* -----------------------------------------------
         BASIC VALIDATION
      ------------------------------------------------ */

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required.",
        });
      }

      const cleanName = name.trim();
      const cleanEmail =
        email.trim().toLowerCase();

      /* -----------------------------------------------
         NAME VALIDATION
      ------------------------------------------------ */

      if (cleanName.length < 2) {
        return res.status(400).json({
          success: false,
          message:
            "Name must contain at least 2 characters.",
        });
      }

      /* -----------------------------------------------
         EMAIL VALIDATION
      ------------------------------------------------ */

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid email address.",
        });
      }

      /* -----------------------------------------------
         PASSWORD VALIDATION
      ------------------------------------------------ */

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters long.",
        });
      }

      /* -----------------------------------------------
         CONFIRM PASSWORD
         
         Frontend currently sends password only.
         Therefore, if confirmPassword is missing,
         we will not block the creation.
         
         If it is provided, it must match.
      ------------------------------------------------ */

      if (
        confirmPassword !== undefined &&
        password !== confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password and confirm password do not match.",
        });
      }

      /* -----------------------------------------------
         CHECK EMAIL ALREADY EXISTS
      ------------------------------------------------ */

      db.query(
        `
          SELECT id, email
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [cleanEmail],
        async (err, results) => {
          if (err) {
            console.error(
              "Check admin email error:",
              err
            );

            return res.status(500).json({
              success: false,
              message: "Database error.",
            });
          }

          /* -------------------------------------------
             DUPLICATE EMAIL
          ------------------------------------------- */

          if (results.length > 0) {
            return res.status(409).json({
              success: false,
              message:
                "This email is already registered.",
            });
          }

          /* -------------------------------------------
             HASH PASSWORD
          ------------------------------------------- */

          let hashedPassword;

          try {
            hashedPassword =
              await bcrypt.hash(password, 10);
          } catch (hashError) {
            console.error(
              "Password hashing error:",
              hashError
            );

            return res.status(500).json({
              success: false,
              message:
                "Failed to secure password.",
            });
          }

          /* -------------------------------------------
             INSERT ADMIN
          ------------------------------------------- */

          db.query(
            `
              INSERT INTO users
              (name, email, password, role)
              VALUES (?, ?, ?, 'admin')
            `,
            [
              cleanName,
              cleanEmail,
              hashedPassword,
            ],
            (insertErr, result) => {
              if (insertErr) {
                console.error(
                  "Create admin database error:",
                  insertErr
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to create admin.",
                });
              }

              /* -------------------------------------
                 SUCCESS
              ------------------------------------- */

              return res.status(201).json({
                success: true,
                message:
                  "New admin created successfully.",
                admin: {
                  id: result.insertId,
                  name: cleanName,
                  email: cleanEmail,
                  role: "admin",
                },
              });
            }
          );
        }
      );
    } catch (error) {
      console.error(
        "Create admin server error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  }
);

/* =====================================================
   CHANGE PASSWORD
===================================================== */

router.put(
  "/change-password",
  authenticateToken,
  (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password, new password and confirm password are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirm password do not match.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters long.",
      });
    }

    db.query(
      `
        SELECT id, password
        FROM users
        WHERE id = ?
      `,
      [userId],
      async (err, results) => {
        if (err) {
          console.error(
            "Change password database error:",
            err
          );

          return res.status(500).json({
            success: false,
            message: "Database error.",
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });
        }

        const user = results[0];

        try {
          const passwordMatch =
            await bcrypt.compare(
              currentPassword,
              user.password
            );

          if (!passwordMatch) {
            return res.status(401).json({
              success: false,
              message:
                "Current password is incorrect.",
            });
          }

          const samePassword =
            await bcrypt.compare(
              newPassword,
              user.password
            );

          if (samePassword) {
            return res.status(400).json({
              success: false,
              message:
                "New password must be different from current password.",
            });
          }

          const hashedPassword =
            await bcrypt.hash(
              newPassword,
              10
            );

          db.query(
            `
              UPDATE users
              SET password = ?
              WHERE id = ?
            `,
            [hashedPassword, userId],
            (updateErr, result) => {
              if (updateErr) {
                console.error(
                  "Update password error:",
                  updateErr
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to update password.",
                });
              }

              if (
                result.affectedRows === 0
              ) {
                return res.status(404).json({
                  success: false,
                  message:
                    "User not found.",
                });
              }

              return res.json({
                success: true,
                message:
                  "Password changed successfully.",
              });
            }
          );
        } catch (passwordError) {
          console.error(
            "Change password error:",
            passwordError
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to change password.",
          });
        }
      }
    );
  }
);

/* =====================================================
   EXPORT
===================================================== */

module.exports = router;