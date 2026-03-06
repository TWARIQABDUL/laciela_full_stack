import React from "react";
import { FaSearch, FaBars } from "react-icons/fa";

function Topbar() {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <h5 className="system-title">BAR MANAGEMENT SYSTEM</h5>
      </div>

      <div className="topbar-right">
        <FaSearch className="top-icon" />
        <FaBars className="top-icon" />
      </div>
    </div>
  );
}

export default Topbar;