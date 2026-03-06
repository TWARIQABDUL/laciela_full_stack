import React from "react";

function Login({ show, handleClose }) {
  if (!show) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        zIndex: 1050,
      }}
    >
      <div
        className="bg-white p-4 position-relative shadow"
        style={{
          width: "400px",
          borderRadius: "20px",
          animation: "fadeIn 0.3s ease",
        }}
      >
        {/* 🔥 Close Icon */}
        <span
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "25px",
            right: "20px",
            fontSize: "22px",
            fontWeight: "bold",
            cursor: "pointer",
            color: "#145C43",
            transition: "0.3s",
          }}
          className="login-close"
        >
          &times;
        </span>

        <h4 className="text-center fw-semibold mb-3">
          Welcome Back
        </h4>

        <p className="text-center text-muted small mb-4">
          Login to access La Cielo Management
        </p>

        <input
          type="email"
          className="form-control rounded-pill mb-3"
          placeholder="Username "
        />

        <input
          type="password"
          className="form-control rounded-pill mb-3"
          placeholder="Password"
        />

        <button className="btn btn-dark rounded-pill w-100 mb-3">
          Login
        </button>

        <div className="text-center small text-muted">
          Forgot password?
        </div>

        <style>
          {`
          .login-close:hover {
            color: #FFD700;
            transform: rotate(90deg);
          }

          @keyframes fadeIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          `}
        </style>
      </div>
    </div>
  );
}

export default Login;