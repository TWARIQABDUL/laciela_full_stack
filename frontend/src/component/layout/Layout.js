import React, { useContext } from "react";
import Navbar from "../include/Navbar";
import Sidebar from "./Sidebar";
import { AuthContext } from "../../context/AuthContext";
import { Outlet } from "react-router-dom";

export default function Layout() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="app-layout" style={styles.wrapper}>
      
      {/* Sidebar only shows for authenticated users on desktop (handled via Sidebar.css media queries) */}
      {isAuthenticated && <Sidebar />}

      <div className="main-viewport" style={styles.main}>
        
        {/* Top Navbar */}
        <Navbar />

        {/* Page Content Area */}
        <main className="page-main-content" style={styles.content}>
          <div className="content-container">
            <Outlet />
          </div>
        </main>

      </div>

      <style>{`
        .app-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background-color: #f8fafc;
        }

        .main-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }

        .page-main-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          background: #f1f5f9;
        }

        .content-container {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        /* Responsive Overrides */
        @media (max-width: 768px) {
          .page-main-content {
            padding: 16px;
          }
        }

        /* Fix for scrollbar aesthetics */
        .page-main-content::-webkit-scrollbar {
          width: 6px;
        }
        .page-main-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .page-main-content::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .page-main-content::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    height: "100vh",
    width: "100%",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    minWidth: 0, // Critical for flex children with overflow
  },
  content: {
    flex: 1,
    overflowY: "auto",
  }
};