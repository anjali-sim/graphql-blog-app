import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleStyles: Record<string, string> = {
  ADMIN: "bg-rose-100 text-rose-700 ring-rose-200",
  EDITOR: "bg-amber-100 text-amber-700 ring-amber-200",
  READER: "bg-slate-100 text-slate-600 ring-slate-200",
};

const navLinkBase =
  "rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-600 hover:bg-indigo-50";
const navLinkActive = "text-indigo-600 bg-indigo-50";

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/");
  };

  useEffect(() => {
    if (!showLogoutModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLogoutModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLogoutModal]);

  const canWrite = user?.role === "EDITOR" || user?.role === "ADMIN";

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/70 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
            📝
          </span>
          <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            BlogCMS
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : ""}`
            }
          >
            Home
          </NavLink>

          {isAuthenticated ? (
            <>
              {canWrite && (
                <>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `${navLinkBase} ${isActive ? navLinkActive : ""}`
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/create-post"
                    className={({ isActive }) =>
                      `${navLinkBase} hidden sm:inline-flex ${
                        isActive ? navLinkActive : ""
                      }`
                    }
                  >
                    + New Post
                  </NavLink>
                </>
              )}
              {user?.role === "ADMIN" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `${navLinkBase} ${isActive ? navLinkActive : ""}`
                  }
                >
                  Admin
                </NavLink>
              )}

              <div className="ml-2 hidden items-center gap-2 sm:flex">
                <span className="text-sm font-medium text-slate-700">
                  {user?.username}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                    roleStyles[user?.role ?? "READER"]
                  }`}
                >
                  {user?.role}
                </span>
              </div>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="btn btn-outline btn-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `${navLinkBase} ${isActive ? navLinkActive : ""}`
                }
              >
                Login
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {showLogoutModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowLogoutModal(false)}
            />

            <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-100 text-xl">
                  👋
                </div>
                <div className="flex-1">
                  <h3
                    id="logout-modal-title"
                    className="text-base font-semibold text-slate-900"
                  >
                    Sign out?
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    You'll need to log in again to access your dashboard and
                    manage posts.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="btn btn-outline btn-sm"
                  autoFocus
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="btn btn-danger btn-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </nav>
  );
};

export default Navbar;
