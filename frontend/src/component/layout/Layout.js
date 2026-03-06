import React from "react";
import { Link } from "react-router-dom";

function Layout({ children }) {
  return (
    <div style={styles.wrapper}>
      
      {/* ===== SIDEBAR ===== */}
      <div style={styles.sidebar}>
        <div style={styles.logoSection}>
          <h4 style={styles.logo}>La Cielo</h4>
          <small style={{ color: "#d4d4d4" }}>Garden</small>
        </div>

        <ul style={styles.menu}>
          <li><Link style={styles.link} to="/">Dashboard</Link></li>
          <li><Link style={styles.link} to="/Bar">Sales</Link></li>
          <li><Link style={styles.link} to="/Stock">Stock</Link></li>
          <li><Link style={styles.link} to="/Expenses">Expenses</Link></li>
          <li><Link style={styles.link} to="/Reports">Reports</Link></li>
          <li><Link style={styles.link} to="/Settings">Settings</Link></li>
        </ul>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={styles.main}>
        
        {/* Top Header */}
        <div style={styles.topbar}>
          <h5 style={{ margin: 0 }}>BAR MANAGEMENT SYSTEM</h5>
        </div>

        {/* Page Content */}
        <div style={styles.content}>
          {children}
        </div>

      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f4f6f9"
  },

  sidebar: {
    width: "240px",
    background: "linear-gradient(180deg, #0f5132, #14532d)",
    color: "white",
    padding: "20px",
    display: "flex",
    flexDirection: "column"
  },

  logoSection: {
    marginBottom: "30px",
    textAlign: "center"
  },

  logo: {
    margin: 0,
    fontWeight: "bold"
  },

  menu: {
    listStyle: "none",
    padding: 0
  },

  link: {
    display: "block",
    padding: "12px 10px",
    marginBottom: "10px",
    borderRadius: "6px",
    textDecoration: "none",
    color: "white",
    backgroundColor: "transparent"
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },

  topbar: {
    backgroundColor: "#1b4332",
    color: "white",
    padding: "15px 25px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
  },

  content: {
    padding: "25px",
    overflowY: "auto"
  }
};

export default Layout;