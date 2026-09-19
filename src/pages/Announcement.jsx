import React, { useEffect, useState } from "react";

const API = "https://medcarefinalproject-production.up.railway.app/api/announcements";


const announcementStyles = `
  .announcement-page {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 30px;
    box-sizing: border-box;
  }

  .announcement-hero {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding: 24px;
    border-radius: 20px;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #f8fafc 100%);
    border: 1px solid #dbeafe;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }

  .announcement-hero-icon {
    width: 58px;
    height: 58px;
    flex: 0 0 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background: #2563eb;
    color: #fff;
    font-size: 28px;
    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
  }

  .announcement-kicker {
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.3px;
    color: #2563eb;
  }

  .announcement-hero h1 {
    margin: 0;
    font-size: 28px;
    line-height: 1.2;
    color: #0f172a;
  }

  .announcement-hero p {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 14px;
  }

  .announcement-count {
    margin-left: auto;
    min-width: 82px;
    padding: 11px 14px;
    border: 1px solid #dbeafe;
    border-radius: 13px;
    background: #fff;
    text-align: center;
  }

  .announcement-count strong {
    display: block;
    color: #1d4ed8;
    font-size: 22px;
    line-height: 1;
  }

  .announcement-count span {
    display: block;
    margin-top: 5px;
    color: #64748b;
    font-size: 11px;
    font-weight: 700;
  }

  .announcement-create-card,
  .announcement-list-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
  }

  .announcement-create-card h2,
  .announcement-list-card h2 {
    margin: 0;
    color: #1e293b;
  }

  .announcement-create-card > p {
    margin: 6px 0 20px;
    color: #64748b;
    font-size: 13px;
  }

  .announcement-field {
    margin-bottom: 16px;
  }

  .announcement-label {
    display: block;
    margin-bottom: 7px;
    color: #334155;
    font-size: 13px;
    font-weight: 700;
  }

  .announcement-input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 13px;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    outline: none;
    color: #1e293b;
    background: #fff;
    font-size: 14px;
    font-family: inherit;
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .announcement-input:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
  }

  .announcement-textarea {
    resize: vertical;
    min-height: 120px;
  }

  .announcement-file-input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px;
    border: 1px dashed #93c5fd;
    border-radius: 10px;
    background: #f8fbff;
    color: #334155;
    font-size: 13px;
  }

  .announcement-help {
    display: block;
    margin-top: 6px;
    color: #94a3b8;
    font-size: 12px;
  }

  .announcement-publish-btn,
  .announcement-view-btn,
  .announcement-delete-btn {
    transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
  }

  .announcement-publish-btn {
    border: none;
    border-radius: 10px;
    padding: 11px 20px;
    background: #2563eb;
    color: #fff;
    font-weight: 700;
    cursor: pointer;
  }

  .announcement-publish-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 7px 16px rgba(37, 99, 235, .22);
    background: #1d4ed8;
  }

  .announcement-publish-btn.is-saving {
    background: #94a3b8;
    cursor: not-allowed;
  }

  .announcement-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  .announcement-section-title {
    font-size: 19px;
  }

  .announcement-section-subtitle {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 13px;
  }

  .announcement-live-badge {
    padding: 7px 10px;
    border-radius: 999px;
    background: #ecfdf5;
    color: #047857;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .4px;
  }

  .announcement-items {
    display: grid;
    gap: 16px;
  }

  .announcement-item {
    padding: 19px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #f8fafc;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }

  .announcement-item:hover {
    transform: translateY(-2px);
    border-color: #bfdbfe;
    box-shadow: 0 8px 22px rgba(15, 23, 42, .06);
  }

  .announcement-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
  }

  .announcement-item-main {
    flex: 1;
    min-width: 0;
  }

  .announcement-item-main h3 {
    margin: 0;
    color: #0f172a;
    font-size: 17px;
    line-height: 1.4;
    word-break: break-word;
  }

  .announcement-published {
    margin-top: 6px;
    color: #94a3b8;
    font-size: 12px;
  }

  .announcement-message {
    margin: 14px 0 0;
    color: #475569;
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .announcement-delete-btn {
    flex: 0 0 auto;
    border: 1px solid #fecaca;
    background: #fff1f2;
    color: #dc2626;
    border-radius: 8px;
    padding: 7px 10px;
    cursor: pointer;
    font-weight: 700;
  }

  .announcement-delete-btn:hover {
    background: #fee2e2;
  }

  .announcement-pdf-box {
    margin-top: 16px;
    padding: 13px;
    border: 1px solid #dbeafe;
    border-radius: 12px;
    background: #eff6ff;
  }

  .announcement-pdf-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .announcement-pdf-name {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .announcement-pdf-name > div {
    min-width: 0;
  }

  .announcement-pdf-name strong {
    display: block;
    max-width: 560px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #1e293b;
    font-size: 13px;
  }

  .announcement-pdf-name small {
    display: block;
    margin-top: 2px;
    color: #64748b;
    font-size: 11px;
  }

  .pdf-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    border-radius: 9px;
    background: #dc2626;
    color: #fff;
    font-size: 10px;
    font-weight: 900;
  }

  .announcement-view-btn {
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    background: #2563eb;
    color: #fff;
    cursor: pointer;
    font-weight: 700;
  }

  .announcement-view-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(37, 99, 235, .20);
    background: #1d4ed8;
  }

  .announcement-permission {
    margin-top: 14px;
    padding: 9px 12px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
  }

  .announcement-empty {
    min-height: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 25px 20px;
    text-align: center;
    color: #64748b;
    background: #f8fafc;
    border-radius: 12px;
  }

  .announcement-empty span {
    font-size: 30px;
  }

  .announcement-empty strong {
    color: #475569;
    font-size: 14px;
  }

  .announcement-empty small {
    color: #94a3b8;
    font-size: 12px;
  }

  @media (max-width: 700px) {
    .announcement-page {
      padding: 18px;
    }

    .announcement-hero {
      align-items: flex-start;
      flex-wrap: wrap;
      padding: 18px;
    }

    .announcement-count {
      margin-left: 0;
      width: 100%;
      box-sizing: border-box;
    }

    .announcement-hero h1 {
      font-size: 24px;
    }

    .announcement-create-card,
    .announcement-list-card {
      padding: 18px;
    }

    .announcement-item-header {
      flex-direction: column;
    }

    .announcement-delete-btn {
      width: 100%;
    }

    .announcement-pdf-row {
      align-items: stretch;
      flex-direction: column;
    }

    .announcement-view-btn {
      width: 100%;
    }
  }
`;

function Announcement() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  const isAdmin = user?.role === "admin";

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);

      const response = await fetch(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch announcements.");
      }

      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to fetch announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePdfChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("PDF size must be 10 MB or less.");
      event.target.value = "";
      return;
    }

    setPdfFile(file);
  };

  const handlePublish = async (event) => {
    event.preventDefault();

    if (!title.trim() || !message.trim()) {
      alert("Please enter title and announcement message.");
      return;
    }

    try {
      setSaving(true);

      let fileData = null;

      if (pdfFile) {
        fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Failed to read PDF."));

          reader.readAsDataURL(pdfFile);
        });
      }

      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          message,
          file_name: pdfFile?.name || null,
          file_type: pdfFile?.type || null,
          file_data: fileData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to publish announcement.");
      }

      alert("Announcement published successfully. ✅");

      setTitle("");
      setMessage("");
      setPdfFile(null);

      const fileInput = document.getElementById("announcement-pdf");
      if (fileInput) fileInput.value = "";

      fetchAnnouncements();
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to publish announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete announcement.");
      }

      setAnnouncements((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to delete announcement.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="announcement-page">
      <style>{announcementStyles}</style>
      <div className="announcement-hero">
        <div className="announcement-hero-icon">📢</div>
        <div>
          <div className="announcement-kicker">HOSPITAL COMMUNICATION</div>
          <h1>Announcements</h1>
          <p>Important notices, hospital updates and official documents.</p>
        </div>
        <div className="announcement-count">
          <strong>{announcements.length}</strong>
          <span>Notices</span>
        </div>
      </div>
      {isAdmin && (
        <div className="announcement-create-card">
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "19px",
              color: "#1e293b",
            }}
          >
            Create New Announcement
          </h2>
          <p
            style={{
              margin: "0 0 20px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Only Admin can publish notices and upload PDF documents.
          </p>

          <form onSubmit={handlePublish}>
            <div className="announcement-field">
              <label className="announcement-label">Announcement Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hospital Holiday Notice"
                className="announcement-input"
              />
            </div>

            <div className="announcement-field">
              <label className="announcement-label">Notice / Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement here..."
                rows="5"
                className="announcement-input announcement-textarea"
              />
            </div>

            <div className="announcement-field">
              <label className="announcement-label">Attach PDF (Optional)</label>
              <input
                id="announcement-pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePdfChange}
                className="announcement-file-input"
              />
              <small className="announcement-help">
                PDF only • Maximum 10 MB
              </small>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`announcement-publish-btn ${saving ? "is-saving" : ""}`}
            >
              {saving ? "Publishing..." : "📤 Publish Announcement"}
            </button>
          </form>
        </div>
      )}

      <div className="announcement-list-card">
        <div className="announcement-list-header">
          <div>
            <h2 className="announcement-section-title">📋 Latest Announcements</h2>
            <p className="announcement-section-subtitle">
              {isAdmin
                ? "Published notices are visible to staff and patients."
                : "View-only notices published by hospital administration."}
            </p>
          </div>
          <span className="announcement-live-badge">● LIVE</span>
        </div>

        {loading ? (
          <div className="announcement-empty"><span>⏳</span><strong>Loading announcements...</strong></div>
        ) : announcements.length === 0 ? (
          <div className="announcement-empty"><span>📭</span><strong>No announcements available yet.</strong><small>New hospital notices will appear here.</small></div>
        ) : (
          <div className="announcement-items">
            {announcements.map((item) => (
              <div key={item.id} className="announcement-item">
                <div className="announcement-item-header">
                  <div className="announcement-item-main">
                    <h3>
                      📌 {item.title}
                    </h3>
                    <div className="announcement-published">
                      Published: {formatDate(item.created_at)}
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="announcement-delete-btn"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>

                <p className="announcement-message">
                  {item.message}
                </p>

                {item.file_data && (
                  <div className="announcement-pdf-box">
                    <div className="announcement-pdf-row">
                      <div className="announcement-pdf-name"><span className="pdf-icon">PDF</span><div><strong>{item.file_name || "Attached PDF"}</strong><small>Official document</small></div></div>

                      <button
                        type="button"
                        onClick={() => {
                          const newWindow = window.open("", "_blank");

                          if (!newWindow) {
                            alert("Please allow pop-ups to view the PDF.");
                            return;
                          }

                          newWindow.document.write(`
                            <html>
                              <head>
                                <title>${item.file_name || "Hospital Notice"}</title>
                                <style>
                                  html, body { margin: 0; height: 100%; }
                                  iframe { width: 100%; height: 100%; border: 0; }
                                </style>
                              </head>
                              <body>
                                <iframe src="${item.file_data}"></iframe>
                              </body>
                            </html>
                          `);
                          newWindow.document.close();
                        }}
                        className="announcement-view-btn"
                      >
                        👁️ View PDF
                      </button>
                    </div>
                  </div>
                )}

                <div className="announcement-permission">🔒 {isAdmin ? "Admin published notice" : "View only • You cannot upload, edit or delete this notice"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export default Announcement;
