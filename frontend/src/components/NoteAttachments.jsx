import {
  FiFile,
  FiFileText,
  FiImage,
  FiPaperclip,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { deleteAttachment, getAttachments, uploadAttachments } from "../api/notesAPi";

const FileIcon = ({ filetype }) => {
  if (filetype.startsWith("image/")) return <FiImage />;
  if (fileType === "application/pdf") return <FiFileText />;
  return <FiFile />;
};

export const NoteAttachments = ({ noteId }) => {
  const { refreshAccessToken } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getAttachments(noteId, refreshAccessToken)
      .then((data) => {
        if (!cancelled) setAttachments(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const newAttachment = await uploadAttachments(
        noteId,
        file,
        refreshAccessToken,
      );
      setAttachments((prev) => [...prev, newAttachment]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (attachmentId) => {
    try {
      await deleteAttachment(attachmentId, refreshAccessToken);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="note-attachments">
      <div className="attachments-header">
        <FiPaperclip className="attachments-icon" />
        <span className="attachment-label">Attachments</span>
        <button
          className="btn btn-attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach a file"
        >
          <FiUpload /> {uploading ? "Uploading..." : "Add File"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*, application/pdf, text/plain, video.mp4, video/quicktime"
          style={{display : "none"}}
          onChange={handleFileChange}
        />

        {error && <p className="attachments-error">{error}</p>}

        {attachments.length > 0 && (
          <ul className="attachments-list">
            {attachments.map((att) => (
              <li className="attachment-item" key={att.id}>
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferer"
                  className="attachment-link"
                >
                  <FileIcon filetype={att.file_type} />
                  <span className="attachment-filename">{att.filename}</span>
                </a>

                <button
                  className="btn btn-icon btn-danger-ghost"
                  onClick={() => handleDelete(att.id)}
                >
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
