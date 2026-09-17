const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();
const db = require("../db");
const authenticateToken = require("../authMiddleware");

// =====================================================
// GET ALL ADMINS
// =====================================================

router.get(
  "/admins",
  authenticateToken,
  (req, res) => {
    // Only admin can view administrator accounts
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only admin can access administrator management.",
      });
    }

    const query = `
      SELECT
        id,
        name,
        email,
        role,
        created_at
      FROM users
      WHERE role = 'admin'
      ORDER BY id ASC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Get admins error:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to get administrators.",
        });
      }

      return res.json({
        success: true,
        admins: results,
      });
    });
  }
);

// =====================================================
// RESET ANOTHER ADMIN PASSWORD
// =====================================================

router.put(
  "/admins/:id/reset-password",
  authenticateToken,
  async (req, res) => {
    // Only admin can reset another admin password
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only admin can reset administrator passwords.",
      });
    }

    const adminId = Number(req.params.id);
    const currentAdminId = Number(req.user.id);

    const { password, confirmPassword } = req.body;

    // Validate ID
    if (!adminId || Number.isNaN(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID.",
      });
    }

    // Prevent self password reset
    if (adminId === currentAdminId) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot reset your own password from Admin Management.",
      });
    }

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    try {
      const checkQuery = `
        SELECT
          id,
          name,
          email,
          role
        FROM users
        WHERE id = ?
          AND role = 'admin'
        LIMIT 1
      `;

      db.query(
        checkQuery,
        [adminId],
        async (err, results) => {
          if (err) {
            console.error(
              "Check admin error:",
              err
            );

            return res.status(500).json({
              success: false,
              message:
                "Failed to check administrator.",
            });
          }

          if (results.length === 0) {
            return res.status(404).json({
              success: false,
              message:
                "Administrator not found.",
            });
          }

          const hashedPassword =
            await bcrypt.hash(password, 10);

          const updateQuery = `
            UPDATE users
            SET password = ?
            WHERE id = ?
              AND role = 'admin'
          `;

          db.query(
            updateQuery,
            [hashedPassword, adminId],
            (updateErr, updateResult) => {
              if (updateErr) {
                console.error(
                  "Reset admin password error:",
                  updateErr
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to reset password.",
                });
              }

              if (
                updateResult.affectedRows === 0
              ) {
                return res.status(404).json({
                  success: false,
                  message:
                    "Administrator not found.",
                });
              }

              return res.json({
                success: true,
                message:
                  `Password reset successfully for ${results[0].name}.`,
              });
            }
          );
        }
      );
    } catch (error) {
      console.error(
        "Password hashing error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to reset password.",
      });
    }
  }
);

// =====================================================
// DELETE / REMOVE ADMIN
// =====================================================

router.delete(
  "/admins/:id",
  authenticateToken,
  (req, res) => {
    // Only admin can remove another admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only admin can remove another administrator.",
      });
    }

    const adminId = Number(req.params.id);
    const currentAdminId = Number(req.user.id);

    // Validate ID
    if (!adminId || Number.isNaN(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID.",
      });
    }

    // Prevent deleting yourself
    if (adminId === currentAdminId) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot remove your own administrator account.",
      });
    }

    // Check target admin
    const checkQuery = `
      SELECT
        id,
        name,
        email,
        role
      FROM users
      WHERE id = ?
        AND role = 'admin'
      LIMIT 1
    `;

    db.query(
      checkQuery,
      [adminId],
      (err, results) => {
        if (err) {
          console.error(
            "Check admin before delete error:",
            err
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to check administrator.",
          });
        }

        // Admin not found
        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message:
              "Administrator not found.",
          });
        }

        const admin = results[0];

        // Delete admin
        const deleteQuery = `
          DELETE FROM users
          WHERE id = ?
            AND role = 'admin'
        `;

        db.query(
          deleteQuery,
          [adminId],
          (deleteErr, deleteResult) => {
            if (deleteErr) {
              console.error(
                "Delete admin error:",
                deleteErr
              );

              return res.status(500).json({
                success: false,
                message:
                  "Failed to remove administrator.",
              });
            }

            if (
              deleteResult.affectedRows === 0
            ) {
              return res.status(404).json({
                success: false,
                message:
                  "Administrator not found.",
              });
            }

            return res.json({
              success: true,
              message:
                `Administrator "${admin.name}" has been removed successfully.`,
              admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
              },
            });
          }
        );
      }
    );
  }
);

module.exports = router;