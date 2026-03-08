import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import logo from "../assets/logo.png";
import { FaBell } from "react-icons/fa";

function Navbar() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user?.role === "SUPER_ADMIN") {
      axios.get(`${process.env.REACT_APP_API_BASE_URL}/requests/count`)
        .then(res => setPendingCount(res.data.count))
        .catch(err => console.error("Could not fetch requests count", err));
    }
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = [
    { name: "Home", path: "/", allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "BAR_MAN", "CHIEF_KITCHEN", "TOKEN_MAN", "LAND_LORD", "GYM"] },
    { name: "Bar", path: "/bar", allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "BAR_MAN"] },
    { name: "Kitchen", path: "/kitchen", allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "CHIEF_KITCHEN"] },
    { name: "Guest House", path: "/guesthouse", allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "LAND_LORD"] },
    { name: "Gym", path: "/gym", allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "GYM"] },
    { name: "Billiard", path: "/billiard", allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TOKEN_MAN"] },
    { name: "Expenses", path: "/expenses", allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    { name: "Staff", path: "/credits", allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    { name: "Reports", path: "/reports", allowedRoles: ["SUPER_ADMIN", "ADMIN"] },
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

              {navLinks
                .filter(item => {
                  // If not authenticated, hide all restricted tabs
                  if (!isAuthenticated || !user) return false;
                  // If the user's role is in the allowedRoles array, show the link
                  return item.allowedRoles.includes(user.role);
                })
                .map((item, index) => (
                <li className="nav-item mx-2" key={index}>
                  <Link className="elite-link" to={item.path}>
                    {item.name}
                  </Link>
                </li>
              ))}

              {/* User Info / Logout / Notifications */}
              {isAuthenticated ? (
                <>
                  {user?.role === "SUPER_ADMIN" && (
                    <li className="nav-item mx-2 position-relative">
                      <Link to="/requests" className="nav-link text-warning fs-5">
                        <FaBell />
                        {pendingCount > 0 && (
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: "0.6rem"}}>
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  )}
                  <li className="nav-item mx-2 text-warning d-flex align-items-center fw-bold">
                    Hello, {user?.username} ({user?.role})
                  </li>
                  <li className="nav-item mx-2">
                    <button
                      className="elite-link fw-bold"
                      onClick={handleLogout}
                      style={{ background: "transparent" }}
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item mx-2">
                  <Link
                    to="/login"
                    className="elite-link fw-bold"
                  >
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>


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