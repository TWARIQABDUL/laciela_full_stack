import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaGlassMartiniAlt,
  FaUtensils,
  FaTableTennis,
  FaDumbbell,
  FaBed,
  FaMoneyBillWave,
  FaArrowRight,
  FaChartLine
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";

function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [totals, setTotals] = useState({
    drinks: 0,
    kitchen: 0,
    billiard: 0,
    gym: 0,
    guesthouse: 0,
    expenses: 0,
    grandTotal: 0,
  });

  const API_BASE = process.env.REACT_APP_API_BASE_URL;

  const fetchTotals = React.useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/total-money`, { withCredentials: true });
      const { drinks, kitchen, billiard, gym, guesthouse, expenses } = res.data;
      const d = Number(drinks || 0);
      const k = Number(kitchen || 0);
      const b = Number(billiard || 0);
      const g = Number(gym || 0);
      const gh = Number(guesthouse || 0);
      
      const grandTotal = d + k + b + g + gh;

      setTotals({
        drinks: d,
        kitchen: k,
        billiard: b,
        gym: g,
        guesthouse: gh,
        expenses: Number(expenses || 0),
        grandTotal,
      });
    } catch (error) {
      console.error("Failed to load totals:", error);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchTotals();
    const interval = setInterval(fetchTotals, 60000); // Auto-refresh metrics every minute
    return () => clearInterval(interval);
  }, [fetchTotals]);

  const pages = [
    { 
      name: "Bar & Drinks", 
      key: "drinks", 
      route: "/bar", 
      icon: <FaGlassMartiniAlt />, 
      color: "#FFD700", 
      gradient: "linear-gradient(135deg, #1a4731 0%, #0a2118 100%)",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "BAR_MAN"] 
    },
    { 
      name: "Kitchen & Food", 
      key: "kitchen", 
      route: "/kitchen", 
      icon: <FaUtensils />, 
      color: "#86efac", 
      gradient: "linear-gradient(135deg, #1e5c43 0%, #0d2e1e 100%)",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "CHIEF_KITCHEN"] 
    },
    { 
      name: "Billiard Area", 
      key: "billiard", 
      route: "/billiard", 
      icon: <FaTableTennis />, 
      color: "#93c5fd", 
      gradient: "linear-gradient(135deg, #1a3a3a 0%, #0a1a1a 100%)",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TOKEN_MAN"] 
    },
    { 
      name: "Gym Center", 
      key: "gym", 
      route: "/gym", 
      icon: <FaDumbbell />, 
      color: "#f9a8d4", 
      gradient: "linear-gradient(135deg, #3d1a47 0%, #1a0a21 100%)",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "GYM"] 
    },
    { 
      name: "Guest House", 
      key: "guesthouse", 
      route: "/guesthouse", 
      icon: <FaBed />, 
      color: "#fdba74", 
      gradient: "linear-gradient(135deg, #5c3d1e 0%, #2e1e0d 100%)",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "LAND_LORD"] 
    },
    { 
      name: "Other Expenses", 
      key: "expenses", 
      route: "/expenses", 
      icon: <FaMoneyBillWave />, 
      color: "#f87171", 
      gradient: "linear-gradient(135deg, #471a1a 0%, #210a0a 100%)",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] 
    },
  ];

  const visiblePages = pages.filter(page => {
    if (!isAuthenticated || !user) return false;
    return page.allowedRoles.includes(user.role);
  });

  const visibleGrandTotal = visiblePages
    .filter(p => p.key !== "expenses")
    .reduce((sum, page) => sum + (totals[page.key] || 0), 0);

  const isHighLevel = user && ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        
        {/* HEADER SECTION */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="welcome-text">Dashboard Overview</h1>
            <p className="welcome-sub">Welcome back, <span className="highlight-username">{user?.username}</span>. Here is your business summary.</p>
          </div>
          <div className="header-right">
            <div className="date-pill">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </header>

        {/* HERO STATS (Total Profit) */}
        {isHighLevel && (
          <section className="hero-stats-section">
            <div className="hero-stat-card">
              <div className="hero-card-inner">
                <div className="hero-icon-wrap">
                  <FaChartLine />
                </div>
                <div className="hero-data">
                  <span className="hero-label">Total Revenue (Excl. Expenses)</span>
                  <div className="hero-value-wrap">
                    <h2 className="hero-value">{visibleGrandTotal.toLocaleString()}</h2>
                    <span className="currency">RWF</span>
                  </div>
                </div>
                <div className="hero-badge">
                  <span>Live Data</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* MAIN MODULE GRID */}
        <section className="module-grid-wrapper">
          <div className="section-title-wrap">
            <h2 className="section-title">Departmental Metrics</h2>
            <div className="title-underline"></div>
          </div>

          <div className="module-grid">
            {visiblePages.map((page) => (
              <div 
                key={page.key} 
                className="pro-module-card"
                style={{ '--accent-color': page.color, '--card-gradient': page.gradient }}
                onClick={() => navigate(page.route)}
              >
                <div className="card-top">
                  <div className="module-icon-box" style={{ background: page.color }}>
                    {page.icon}
                  </div>
                  <div className="card-arrow">
                    <FaArrowRight />
                  </div>
                </div>
                <div className="card-mid">
                  <h4 className="module-name">{page.name}</h4>
                  <div className="module-stat">
                    <span className="stat-value">{totals[page.key].toLocaleString()}</span>
                    <span className="stat-unit">RWF</span>
                  </div>
                </div>
                <div className="card-bottom-glow" style={{ background: page.color }}></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .dashboard-wrapper {
          min-height: 100%;
          padding-bottom: 40px;
        }

        .dashboard-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Header Styles */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .welcome-text {
          font-size: 2.2rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .welcome-sub {
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
        }

        .highlight-username {
          color: #166534;
          font-weight: 700;
        }

        .date-pill {
          background: white;
          padding: 8px 20px;
          border-radius: 30px;
          font-weight: 600;
          color: #1e293b;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.05);
        }

        /* Hero Stat Card */
        .hero-stats-section {
          margin-bottom: 50px;
        }

        .hero-stat-card {
          background: linear-gradient(135deg, #0a2118 0%, #0d3d2a 100%);
          border-radius: 24px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          color: white;
        }

        .hero-stat-card::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-card-inner {
          display: flex;
          align-items: center;
          gap: 24px;
          position: relative;
          z-index: 2;
        }

        .hero-icon-wrap {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.08);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          color: #ffd700;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .hero-label {
          font-size: 0.95rem;
          color: #86efac;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
          display: block;
        }

        .hero-value-wrap {
          display: flex;
          align-items: flex-end;
          gap: 12px;
        }

        .hero-value {
          font-size: 3.5rem;
          font-weight: 900;
          margin: 0;
          line-height: 1;
          letter-spacing: -0.04em;
          color: white;
        }

        .currency {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffd700;
          padding-bottom: 8px;
        }

        .hero-badge {
          margin-left: auto;
          background: rgba(134,239,172,0.15);
          color: #86efac;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid rgba(134,239,172,0.3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Module Grid Styles */
        .section-title-wrap {
          margin-bottom: 30px;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .title-underline {
          width: 50px;
          height: 4px;
          background: #ffd700;
          border-radius: 4px;
        }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .pro-module-card {
          background: var(--card-gradient);
          border-radius: 22px;
          padding: 24px;
          cursor: pointer;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        .pro-module-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px rgba(0,0,0,0.3);
          border-color: rgba(255,255,255,0.15);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }

        .module-icon-box {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: #0a2118;
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }

        .card-arrow {
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.4);
          transition: all 0.3s;
        }

        .pro-module-card:hover .card-arrow {
          color: var(--accent-color);
          background: rgba(255,255,255,0.1);
          transform: translateX(4px);
        }

        .module-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
          margin-bottom: 6px;
        }

        .module-stat {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .stat-value {
          font-size: 2.2rem;
          font-weight: 800;
          color: white;
          line-height: 1;
        }

        .stat-unit {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--accent-color);
          padding-bottom: 4px;
        }

        .card-bottom-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          opacity: 0.4;
          filter: blur(8px);
        }

        .pro-module-card:hover .card-bottom-glow {
          opacity: 0.8;
          height: 6px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .welcome-text { font-size: 1.8rem; }
          .hero-value { font-size: 2.5rem; }
          .hero-stat-card { padding: 24px; }
          .hero-icon-wrap { width: 60px; height: 60px; font-size: 1.6rem; }
          .module-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

export default Home;