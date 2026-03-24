import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    const onMouse = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const email   = user?.email ?? "";
  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="user-avatar">{initial}</span>
        <span className="user-email-short">{email}</span>
        <span className={`user-chevron${open ? " user-chevron--open" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-info">
            <span className="user-avatar user-avatar--lg">{initial}</span>
            <div className="user-dropdown-text">
              <p className="user-dropdown-label">Signed in as</p>
              <p className="user-dropdown-email">{email}</p>
            </div>
          </div>

          <hr className="user-dropdown-divider" />

          <button
            className="user-dropdown-signout"
            onClick={() => { setOpen(false); logout(); }}
            role="menuitem"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
