const express = require("express");
const router = express.Router();

const db = require("../db");

// ==========================================
// DASHBOARD
// ==========================================

router.get("/stats", (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  // ==========================================
  // ROLE-WISE DASHBOARD STATS
  // ==========================================

  let statsQuery = "";
  let statsParams = [];

  // ==========================================
  // ADMIN
  // ==========================================

  if (role === "admin") {
    statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM patients) AS patients,

        (SELECT COUNT(*) FROM doctors) AS doctors,

        (SELECT COUNT(*) FROM appointments) AS appointments,

        (
          SELECT COALESCE(SUM(d.consultation_fee), 0)
          FROM appointments a
          JOIN doctors d
            ON a.doctor_id = d.id
          WHERE a.status = 'completed'
        ) AS revenue
    `;
  }

  // ==========================================
  // DOCTOR
  // ==========================================

  else if (role === "doctor") {
    statsQuery = `
      SELECT
        (
          SELECT COUNT(DISTINCT a.patient_id)
          FROM appointments a
          JOIN doctors d
            ON a.doctor_id = d.id
          WHERE d.user_id = ?
        ) AS patients,

        (
          SELECT COUNT(*)
          FROM doctors
          WHERE user_id = ?
        ) AS doctors,

        (
          SELECT COUNT(*)
          FROM appointments a
          JOIN doctors d
            ON a.doctor_id = d.id
          WHERE d.user_id = ?
        ) AS appointments,

        (
          SELECT COALESCE(SUM(d.consultation_fee), 0)
          FROM appointments a
          JOIN doctors d
            ON a.doctor_id = d.id
          WHERE d.user_id = ?
            AND a.status = 'completed'
        ) AS revenue
    `;

    statsParams = [
      userId,
      userId,
      userId,
      userId,
    ];
  }

  // ==========================================
  // PATIENT
  // ==========================================

  else if (role === "patient") {
    statsQuery = `
      SELECT
        1 AS patients,

        (
          SELECT COUNT(*)
          FROM doctors
        ) AS doctors,

        (
          SELECT COUNT(*)
          FROM appointments a
          JOIN patients p
            ON a.patient_id = p.id
          WHERE p.user_id = ?
        ) AS appointments,

        0 AS revenue
    `;

    statsParams = [userId];
  }

  // ==========================================
  // INVALID ROLE
  // ==========================================

  else {
    return res.status(403).json({
      success: false,
      message: "Invalid user role.",
    });
  }

  // ==========================================
  // EXECUTE MAIN STATS
  // ==========================================

  db.query(
    statsQuery,
    statsParams,
    (err, statsResult) => {
      if (err) {
        console.error(
          "Dashboard stats error:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to get dashboard statistics",
        });
      }

      // ==========================================
      // TODAY'S APPOINTMENTS
      // ==========================================

      let todayAppointmentsQuery = `
        SELECT
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          a.reason,

          p.id AS patient_id,
          pu.name AS patient_name,

          d.id AS doctor_id,
          du.name AS doctor_name,

          d.department,
          d.specialization

        FROM appointments a

        JOIN patients p
          ON a.patient_id = p.id

        JOIN users pu
          ON p.user_id = pu.id

        JOIN doctors d
          ON a.doctor_id = d.id

        JOIN users du
          ON d.user_id = du.id

        WHERE DATE(a.appointment_date) = CURDATE()
      `;

      const appointmentParams = [];

      // ==========================================
      // DOCTOR FILTER
      // ==========================================

      if (role === "doctor") {
        todayAppointmentsQuery += `
          AND d.user_id = ?
        `;

        appointmentParams.push(userId);
      }

      // ==========================================
      // PATIENT FILTER
      // ==========================================

      if (role === "patient") {
        todayAppointmentsQuery += `
          AND p.user_id = ?
        `;

        appointmentParams.push(userId);
      }

      todayAppointmentsQuery += `
        ORDER BY
          a.appointment_date ASC,
          a.appointment_time ASC
      `;

      // ==========================================
      // TODAY'S APPOINTMENTS
      // ==========================================

      db.query(
        todayAppointmentsQuery,
        appointmentParams,
        (err, appointmentResult) => {
          if (err) {
            console.error(
              "Today's appointments error:",
              err
            );

            return res.status(500).json({
              success: false,
              message:
                "Failed to get today's appointments",
            });
          }

          // ==========================================
          // APPOINTMENT ANALYTICS
          // ==========================================

          let analyticsQuery = `
            SELECT
              COUNT(*) AS total,

              SUM(
                CASE
                  WHEN status = 'completed'
                  THEN 1
                  ELSE 0
                END
              ) AS completed,

              SUM(
                CASE
                  WHEN status = 'confirmed'
                  THEN 1
                  ELSE 0
                END
              ) AS confirmed,

              SUM(
                CASE
                  WHEN status = 'pending'
                  THEN 1
                  ELSE 0
                END
              ) AS pending,

              SUM(
                CASE
                  WHEN status = 'cancelled'
                  THEN 1
                  ELSE 0
                END
              ) AS cancelled

            FROM appointments
          `;

          const analyticsParams = [];

          // ==========================================
          // DOCTOR ANALYTICS
          // ==========================================

          if (role === "doctor") {
            analyticsQuery += `
              WHERE doctor_id IN (
                SELECT id
                FROM doctors
                WHERE user_id = ?
              )
            `;

            analyticsParams.push(userId);
          }

          // ==========================================
          // PATIENT ANALYTICS
          // ==========================================

          if (role === "patient") {
            analyticsQuery += `
              WHERE patient_id IN (
                SELECT id
                FROM patients
                WHERE user_id = ?
              )
            `;

            analyticsParams.push(userId);
          }

          // ==========================================
          // EXECUTE ANALYTICS
          // ==========================================

          db.query(
            analyticsQuery,
            analyticsParams,
            (err, analyticsResult) => {
              if (err) {
                console.error(
                  "Appointment analytics error:",
                  err
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to get appointment analytics",
                });
              }

              // ==========================================
              // DEPARTMENTS
              // ==========================================

              const departmentsQuery = `
                SELECT
                  department,
                  COUNT(*) AS doctor_count
                FROM doctors
                WHERE department IS NOT NULL
                  AND department <> ''
                GROUP BY department
                ORDER BY
                  doctor_count DESC,
                  department ASC
              `;

              db.query(
                departmentsQuery,
                (err, departmentResult) => {
                  if (err) {
                    console.error(
                      "Departments error:",
                      err
                    );

                    return res.status(500).json({
                      success: false,
                      message:
                        "Failed to get departments",
                    });
                  }

                  // ==========================================
                  // ANALYTICS DATA
                  // ==========================================

                  const analytics =
                    analyticsResult[0] || {};

                  // ==========================================
                  // FINAL RESPONSE
                  // ==========================================

                  res.json({
                    success: true,

                    // ========================================
                    // MAIN STATS
                    // ========================================

                    stats: {
                      patients:
                        statsResult[0].patients,

                      doctors:
                        statsResult[0].doctors,

                      appointments:
                        statsResult[0].appointments,

                      revenue:
                        statsResult[0].revenue,
                    },

                    // ========================================
                    // APPOINTMENT ANALYTICS
                    // ========================================

                    appointmentAnalytics: {
                      total:
                        Number(
                          analytics.total || 0
                        ),

                      completed:
                        Number(
                          analytics.completed || 0
                        ),

                      confirmed:
                        Number(
                          analytics.confirmed || 0
                        ),

                      pending:
                        Number(
                          analytics.pending || 0
                        ),

                      cancelled:
                        Number(
                          analytics.cancelled || 0
                        ),
                    },

                    // ========================================
                    // TODAY'S APPOINTMENTS
                    // ========================================

                    todayAppointments:
                      appointmentResult,

                    // ========================================
                    // DEPARTMENTS
                    // ========================================

                    departments:
                      departmentResult,
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

module.exports = router;