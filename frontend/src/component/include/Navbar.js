import React, { useState } from "react";
import { Link } from "react-router-dom";
import Login from "../login/Login";
import logo from "../assets/logo.png";

function Navbar() {
  const [showLogin, setShowLogin] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Bar", path: "/bar" },
    { name: "Kitchen", path: "/kitchen" },
    { name: "Guest House", path: "/guesthouse" },
    { name: "Gym", path: "/gym" },
    { name: "Billiard", path: "/billiard" },
    { name: "Expenses", path: "/expenses" },
    { name: "Staff", path: "/credits" },
  ];

  return (
    <>
      <nav
        className="navbar navbar-expand-lg shadow"
        style={{
          background: "linear-gradient(90deg, #0B2E26, #145C43)",
          padding: "12px 25px",
        }}
      >
        <div className="container-fluid">

          {/* Logo */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img
              src={logo}
              alt="La Cielo"
              style={{ height: "60px" }}
            />
          </Link>

          <div className="collapse navbar-collapse show">
            <ul className="navbar-nav ms-auto align-items-center">

              {navLinks.map((item, index) => (
                <li className="nav-item mx-2" key={index}>
                  <Link className="elite-link" to={item.path}>
                    {item.name}
                  </Link>
                </li>
              ))}

              {/* Login Button */}
              <li className="nav-item mx-2">
                <button
                  className="elite-link fw-bold"
                  onClick={() => setShowLogin(true)}
                  style={{ background: "transparent" }}
                >
                  Login
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <Login show={showLogin} handleClose={() => setShowLogin(false)} />

      {/* Button Style */}
      <style>
        {`
        .elite-link {
          background: transparent;
          color: #FFD700 !important;
          border: 2px solid #FFD700;
          border-radius: 25px;
          padding: 8px 20px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .elite-link:hover {
          background: linear-gradient(45deg, #FFD700, #C8A96A);
          color: #0B2E26 !important;
          box-shadow: 0 0 15px rgba(255,215,0,0.6);
          transform: scale(1.05);
        }
        `}
      </style>
    </>
  );
}

export default Navbar;