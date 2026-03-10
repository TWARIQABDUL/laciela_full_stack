import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import logo from "../assets/logo.png";
import "./Navbar.css";
import {
  FaBell, FaBars, FaTimes, FaSignOutAlt, FaChevronDown,
  FaHome, FaGlassMartini, FaUtensils, FaBuilding,
  FaDumbbell, FaBullseye, FaMoneyBill, FaUsers,
  FaChartLine, FaClipboardList
} from "react-icons/fa";

const NAV_LINKS = [
  { name: "Home",       path: "/",          icon: <FaHome />,         roles: ["SUPER_ADMIN","ADMIN","MANAGER","BAR_MAN","CHIEF_KITCHEN","TOKEN_MAN","LAND_LORD","GYM"] },
  { name: "Bar",        path: "/bar",        icon: <FaGlassMartini />, roles: ["SUPER_ADMIN","ADMIN","MANAGER","BAR_MAN"] },
  { name: "Kitchen",    path: "/kitchen",    icon: <FaUtensils />,     roles: ["SUPER_ADMIN","ADMIN","MANAGER","CHIEF_KITCHEN"] },
  { name: "Guest House",path: "/guesthouse", icon: <FaBuilding />,     roles: ["SUPER_ADMIN","ADMIN","MANAGER","LAND_LORD"] },
  { name: "Gym",        path: "/gym",        icon: <FaDumbbell />,     roles: ["SUPER_ADMIN","ADMIN","MANAGER","GYM"] },
  { name: "Billiard",   path: "/billiard",   icon: <FaBullseye />,     roles: ["SUPER_ADMIN","ADMIN","MANAGER","TOKEN_MAN"] },
  { name: "Expenses",   path: "/expenses",   icon: <FaMoneyBill />,    roles: ["SUPER_ADMIN","ADMIN","MANAGER"] },
  { name: "Staff",      path: "/credits",    icon: <FaUsers />,        roles: ["SUPER_ADMIN","ADMIN","MANAGER"] },
  { name: "Reports",    path: "/reports",    icon: <FaChartLine />,    roles: ["SUPER_ADMIN","ADMIN"] },
];

function roleLabel(role) {
  const map = {
    SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MANAGER: "Manager",
    BAR_MAN: "Barman", CHIEF_KITCHEN: "Chef", TOKEN_MAN: "Token Man",
    LAND_LORD: "Land Lord", GYM: "Gym Staff", EMPLOYEE: "Employee",
  };
  return map[role] || role;
}

function initials(name = "") {
  return name.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Fetch pending requests count
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "SUPER_ADMIN") return;
    const fetchCount = () => {
      axios.get(`${process.env.REACT_APP_API_BASE_URL}/requests/count`, { withCredentials: true })
        .then(res => setPendingCount(res.data.count))
        .catch(() => {});
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated, user]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const visibleLinks = isAuthenticated && user
    ? NAV_LINKS.filter(l => l.roles.includes(user.role))
    : [];

  return (
    <nav className="main-navbar">
      {/* ── Brand ─────────────────────────── */}
      <Link to="/" className="navbar-brand">
        <img src={logo} alt="La Cielo" style={{ height: 46 }} />
        {/* <div className="brand-text">
          <span className="brand-name">La Cielo</span>
          <span className="brand-sub">Management System</span>
        </div> */}
      </Link>

      {/* ── Desktop Links ─────────────────── */}
      <ul className="desktop-links">
        {visibleLinks.map(link => (
          <li key={link.path}>
            <NavLink
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) => 
                isActive ? "nav-link-item active" : "nav-link-item"
              }
            >
              <span className="nav-link-icon">{link.icon}</span>
              {link.name}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* ── Right Side ───────────────────── */}
      <div className="navbar-right">

        {/* Bell (SUPER_ADMIN) */}
        {isAuthenticated && user?.role === "SUPER_ADMIN" && (
          <Link to="/requests" className="notification-btn">
            <FaBell />
            {pendingCount > 0 && (
              <span className="bell-badge">{pendingCount > 99 ? "99+" : pendingCount}</span>
            )}
          </Link>
        )}

        {/* Profile dropdown */}
        {isAuthenticated && user ? (
          <div className="profile-container" ref={profileRef}>
            <button 
              className="profile-trigger" 
              onClick={() => setProfileOpen(p => !p)}
              aria-expanded={profileOpen}
            >
              <div className="user-avatar">{initials(user.username)}</div>
              <div className="profile-info">
                <span className="username">{user.username}</span>
                <span className="role">{roleLabel(user.role)}</span>
              </div>
              <FaChevronDown className="chevron-icon" />
            </button>

            {profileOpen && (
              <div className="profile-dropdown-menu blur-effect">
                <div className="dropdown-user-header">
                  <div className="user-avatar avatar-lg">{initials(user.username)}</div>
                  <div>
                    <div className="bold-name">{user.username}</div>
                    <div className="pale-role">{roleLabel(user.role)}</div>
                  </div>
                </div>
                <hr className="nav-divider" />
                {user.role === "SUPER_ADMIN" && (
                  <Link to="/requests" className="dropdown-link" onClick={() => setProfileOpen(false)}>
                    <FaClipboardList className="link-icon" /> Pending Requests
                  </Link>
                )}
                <button className="nav-logout-btn" onClick={handleLogout}>
                  <FaSignOutAlt className="link-icon" /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-nav-btn">Sign In</Link>
        )}

        {/* ── Hamburger (mobile) ─── */}
        <button className="hamburger-menu" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* ── Mobile Menu Overlay ─── */}
      {menuOpen && (
        <div className="mobile-nav-drawer blur-effect">
          {visibleLinks.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) => 
                isActive ? "mobile-nav-link active" : "mobile-nav-link"
              }
              onClick={() => setMenuOpen(false)}
            >
              <span className="link-icon" style={{ marginRight: 12 }}>{link.icon}</span>
              {link.name}
            </NavLink>
          ))}
          {isAuthenticated && (
            <button className="mobile-logout-btn" onClick={handleLogout} style={{ marginTop: 8 }}>
              <FaSignOutAlt className="link-icon" style={{ marginRight: 8 }} /> Sign Out
            </button>
          )}
        </div>
      )}

      {/* Adding some extra styles that are easier in JS or niche */}
      <style>{`
        .profile-container { position: relative; }
        .profile-dropdown-menu {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 240px;
          background: rgba(15, 45, 31, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          z-index: 1000;
        }
        .dropdown-user-header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        .avatar-lg { width: 44px !important; height: 44px !important; font-size: 1.1rem !important; }
        .bold-name { font-weight: 700; color: white; font-size: 1rem; }
        .pale-role { color: #86efac; font-size: 0.75rem; }
        .nav-divider { border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 12px 0; }
        .dropdown-link { display: flex; align-items: center; padding: 10px; border-radius: 10px; color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.9rem; transition: background 0.2s; }
        .dropdown-link:hover { background: rgba(255, 255, 255, 0.05); }
        .nav-logout-btn { display: flex; align-items: center; width: 100%; padding: 10px; border-radius: 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
        .nav-logout-btn:hover { background: rgba(239, 68, 68, 0.2); }
        .link-icon { font-size: 1rem; }
        .login-nav-btn { background: var(--accent-gold); color: #0a2118; padding: 8px 20px; border-radius: 10px; font-weight: 700; text-decoration: none; }
        .mobile-logout-btn { display: flex; align-items: center; width: 100%; padding: 12px 16px; border-radius: 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; font-weight: 600; cursor: pointer; }
      `}</style>
    </nav>
  );
}