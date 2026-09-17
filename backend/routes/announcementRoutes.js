const express = require("express");
const router = express.Router();
const db = require("../db");

// ===============================
// GET ALL ANNOUNCEMENTS
// Admin / Doctor / Patient
// ===============================
router.get("/", (req, res) => {
  const query = `
    SELECT 
      id,
      title,
      message,
      file_name,
      file_type,
      file_data,
      created_at
    FROM announcements
    ORDER BY created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Get announcements error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch announcements.",
      });
    }

    res.json({
      success: true,
      announcements: results,
    });
  });
});

// ===============================
// CREATE ANNOUNCEMENT
// ADMIN ONLY
// ===============================
router.post("/", (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can create announcements.",
    });
  }

  const {
    title,
    message,
    file_name,
    file_type,
    file_data,
  } = req.body;

  // Title validation
  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Announcement title is required.",
    });
  }

  // Message validation
  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Announcement message is required.",
    });
  }

  // Only PDF allowed
  if (file_data && file_type !== "application/pdf") {
    return res.status(400).json({
      success: false,
      message: "Only PDF files are allowed.",
    });
  }

  // PDF size check
  if (file_data && file_data.length > 14 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "PDF is too large. Please upload a file up to 10 MB.",
    });
  }

  const query = `
    INSERT INTO announcements
    (
      title,
      message,
      file_name,
      file_type,
      file_data,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      title.trim(),
      message.trim(),
      file_name || null,
      file_type || null,
      file_data || null,
      req.user.id,
    ],
    (err, result) => {
      if (err) {
        console.error("Create announcement error:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to create announcement.",
        });
      }

      res.status(201).json({
        success: true,
        message: "Announcement published successfully.",
        id: result.insertId,
      });
    }
  );
});

// ===============================
// DELETE ANNOUNCEMENT
// ADMIN ONLY
// ===============================
router.delete("/:id", (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can delete announcements.",
    });
  }

  db.query(
    "DELETE FROM announcements WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error("Delete announcement error:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to delete announcement.",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Announcement not found.",
        });
      }

      res.json({
        success: true,
        message: "Announcement deleted successfully.",
      });
    }
  );
});

module.exports = router;