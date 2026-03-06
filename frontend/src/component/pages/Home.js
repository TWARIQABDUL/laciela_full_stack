import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaGlassMartiniAlt,
  FaUtensils,
  FaTableTennis,
  FaDumbbell,
  FaBed,
  FaMoneyBillWave,
} from "react-icons/fa";

function Home() {
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchTotals();
  }, []);

  const fetchTotals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/total-money`);
      const { drinks, kitchen, billiard, gym, guesthouse, expenses } =
        res.data;
      const grandTotal = drinks + kitchen + billiard + gym + guesthouse;

      setTotals({
        drinks,
        kitchen,
        billiard,
        gym,
        guesthouse,
        expenses,
        grandTotal,
      });
    } catch (error) {
      console.error("Failed to load totals:", error);
    }
  };

  const pages = [
    { name: "Drinks", key: "drinks", route: "/bar", icon: <FaGlassMartiniAlt size={40} /> },
    { name: "Kitchen", key: "kitchen", route: "/kitchen", icon: <FaUtensils size={40} /> },
    { name: "Billiard", key: "billiard", route: "/billiard", icon: <FaTableTennis size={40} /> },
    { name: "Gym", key: "gym", route: "/gym", icon: <FaDumbbell size={40} /> },
    { name: "Guest House", key: "guesthouse", route: "/guesthouse", icon: <FaBed size={40} /> },
    { name: "Expenses", key: "expenses", route: "/expenses", icon: <FaMoneyBillWave size={40} /> },
  ];

  return (
    <div
      className="container-fluid min-vh-100 py-5"
      style={{
        background: "#f2f2f2", // Soft gray background
      }}
    >
      {/* HEADER */}
      <div className="text-center mb-5">
        <h1 className="fw-bold text-dark">La Cielo GARDEN</h1>
        <p className="text-muted fs-5">
          Overview of all sections and profits
        </p>
      </div>

      {/* SECTION CARDS */}
      <div className="container">
        <div className="row g-4">
          {pages.map((page) => (
            <div key={page.key} className="col-12 col-md-4">
              <div
                className="card h-100 p-4 text-center border-0"
                style={{
                  cursor: "pointer",
                  borderRadius: "18px",
                  background: "#ffffff",
                  transition: "all 0.3s ease",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                }}
                onClick={() => navigate(page.route)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow =
                    "0 15px 35px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(0,0,0,0.08)";
                }}
              >
                <div className="mb-3 text-secondary">{page.icon}</div>
                <h5 className="fw-bold text-dark">{page.name}</h5>
                <h3 className="fw-bold mt-2 text-dark">
                  {totals[page.key].toLocaleString()} RWF
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* GRAND TOTAL */}
        <div className="mt-5">
          <div
            className="card p-5 text-center border-0"
            style={{
              borderRadius: "22px",
              background: "#ffffff",
              boxShadow: "0 15px 40px rgba(0,0,0,0.1)",
            }}
          >
            <h3 className="fw-bold text-dark">
              Total Profit (Expenses Excluded)
            </h3>
            <h1 className="display-4 fw-bold mt-3 text-dark">
              {totals.grandTotal.toLocaleString()} RWF
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;