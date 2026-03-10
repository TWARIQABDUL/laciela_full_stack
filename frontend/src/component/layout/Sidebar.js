import React, { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logo from "../assets/logo.png";
import axios from "axios";
import "./Sidebar.css";
import {
  FaHome, FaGlassMartiniAlt, FaUtensils, FaBuilding,
  FaDumbbell, FaBullseye, FaMoneyBillWave, FaUsers,
  FaChartLine, FaClipboardList, FaSignOutAlt, FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";

const SIDEBAR_ITEMS = [
  { name: "Dashboard",   path: "/",          icon: <FaHome />,             roles: ["SUPER_ADMIN","ADMIN","MANAGER","BAR_MAN","CHIEF_KITCHEN","TOKEN_MAN","LAND_LORD","GYM"] },
  { name: "Bar",         path: "/bar",        icon: <FaGlassMartiniAlt />,  roles: ["SUPER_ADMIN","ADMIN","MANAGER","BAR_MAN"] },
  { name: "Kitchen",     path: "/kitchen",    icon: <FaUtensils />,          roles: ["SUPER_ADMIN","ADMIN","MANAGER","CHIEF_KITCHEN"] },
  { name: "Guest House", path: "/guesthouse", icon: <FaBuilding />,          roles: ["SUPER_ADMIN","ADMIN","MANAGER","LAND_LORD"] },
  { name: "Gym",         path: "/gym",        icon: <FaDumbbell />,          roles: ["SUPER_ADMIN","ADMIN","MANAGER","GYM"] },
  { name: "Billiard",    path: "/billiard",   icon: <FaBullseye />,          roles: ["SUPER_ADMIN","ADMIN","MANAGER","TOKEN_MAN"] },
  { name: "Expenses",    path: "/expenses",   icon: <FaMoneyBillWave />,     roles: ["SUPER_ADMIN","ADMIN","MANAGER"] },
  { name: "Staff",       path: "/credits",    icon: <FaUsers />,             roles: ["SUPER_ADMIN","ADMIN","MANAGER"] },
  { name: "Reports",     path: "/reports",    icon: <FaChartLine />,         roles: ["SUPER_ADMIN","ADMIN"] },
  { name: "Requests",    path: "/requests",   icon: <FaClipboardList />,     roles: ["SUPER_ADMIN"], hasBadge: true },
];

const ROLE_COLORS = {
  SUPER_ADMIN:   { bg: "rgba(255,215,0,0.15)",   text: "#ffd700" },
  ADMIN:         { bg: "rgba(134,239,172,0.15)",  text: "#86efac" },
  MANAGER:       { bg: "rgba(147,197,253,0.15)",  text: "#93c5fd" },
  BAR_MAN:       { bg: "rgba(249,168,212,0.15)",  text: "#f9a8d4" },
  CHIEF_KITCHEN: { bg: "rgba(253,186,116,0.15)",  text: "#fdba74" },
  TOKEN_MAN:     { bg: "rgba(167,243,208,0.15)",  text: "#a7f3d0" },
  LAND_LORD:     { bg: "rgba(196,181,253,0.15)",  text: "#c4b5fd" },
  GYM:           { bg: "rgba(110,231,183,0.15)",  text: "#6ee7b7" },
};

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MANAGER: "Manager",
  BAR_MAN: "Barman", CHIEF_KITCHEN: "Chef", TOKEN_MAN: "Token Man",
  LAND_LORD: "Land Lord", GYM: "Gym Staff",
};

function initials(name = "") { return name.slice(0, 2).toUpperCase(); }

export default function Sidebar() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending requests count (mirrors Navbar logic)
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

  const visibleItems = user
    ? SIDEBAR_ITEMS.filter(item => item.roles.includes(user.role))
    : [];

  const roleStyle = ROLE_COLORS[user?.role] || { bg: "rgba(255,255,255,0.1)", text: "#fff" };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar-container" style={{ width: collapsed ? "68px" : "240px" }}>
      
      {/* ── Brand / Header ── */}
      <div className="sidebar-brand">
        {!collapsed && (
          <div className="sidebar-logo-group">
            <img src={logo} alt="Logo" style={{ height: 32 }} />
            <div>
              <div className="sidebar-logo-name">La Cielo</div>
              <div className="sidebar-logo-sub">Management</div>
            </div>
          </div>
        )}
        <button className="collapse-toggle" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand" : "Collapse"}>
          {collapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
        </button>
      </div>

      {/* ── User Card ── */}
      {user && (
        <div className="sidebar-user-section">
          <div className="sidebar-avatar" title={user.username}>{initials(user.username)}</div>
          {!collapsed && (
            <div className="sidebar-user-details">
              <div className="name">{user.username}</div>
              <span className="sidebar-role-badge" style={{ background: roleStyle.bg, color: roleStyle.text }}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Menu Section ── */}
      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => 
              isActive ? "sidebar-link active" : "sidebar-link"
            }
            title={collapsed ? item.name : undefined}
          >
            <div className="sidebar-link-icon-container">
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.hasBadge && pendingCount > 0 && collapsed && (
                <span className="sidebar-collapsed-badge"></span>
              )}
            </div>
            {!collapsed && (
              <div className="sidebar-link-text-container">
                <span className="sidebar-link-label">{item.name}</span>
                {item.hasBadge && pendingCount > 0 && (
                  <span className="sidebar-nav-badge">{pendingCount > 99 ? "99+" : pendingCount}</span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer / Logout ── */}
      <div className="sidebar-footer">
        <button 
          className="sidebar-logout-btn" 
          onClick={handleLogout}
          title={collapsed ? "Sign Out" : undefined}
        >
          <FaSignOutAlt style={{ marginRight: collapsed ? 0 : 10 }} />
          {!collapsed && "Sign Out"}
        </button>
      </div>

    </aside>
  );
}