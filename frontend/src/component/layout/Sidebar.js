import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaChartBar,
  FaBoxes,
  FaMoneyBill,
  FaFileAlt,
  FaCog
} from "react-icons/fa";

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="logo-section">
        <h3 className="logo-text">La Cielo</h3>
        <span className="sub-text">Garden</span>
      </div>

      <ul className="menu">
        <li>
          <NavLink to="/" className="menu-link">
            <FaHome className="icon" />
            Dashboard
          </NavLink>
        </li>

        <li>
          <NavLink to="/bar" className="menu-link">
            <FaChartBar className="icon" />
            Sales
          </NavLink>
        </li>

        <li>
          <NavLink to="/stock" className="menu-link">
            <FaBoxes className="icon" />
            Stock
          </NavLink>
        </li>

        <li>
          <NavLink to="/expenses" className="menu-link">
            <FaMoneyBill className="icon" />
            Expenses
          </NavLink>
        </li>

        <li>
          <NavLink to="/reports" className="menu-link">
            <FaFileAlt className="icon" />
            Reports
          </NavLink>
        </li>

        <li>
          <NavLink to="/settings" className="menu-link">
            <FaCog className="icon" />
            Settings
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;