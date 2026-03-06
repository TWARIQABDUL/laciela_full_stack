import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function Employees() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [totalPayment, setTotalPayment] = useState(0);

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/credits`;

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setEmployees(res.data);
      recalcTotals(res.data);
    } catch (err) {
      console.error(err);
      setEmployees([]);
      setTotalPayment(0);
    } finally {
      setLoading(false);
    }
  };

  const recalcTotals = (data) => {
    let paymentSum = 0;
    data.forEach((e) => {
      paymentSum += Number(e.payment || 0);
    });
    setTotalPayment(paymentSum);
  };

  const handleAddEmployee = async () => {
    const name = prompt("Employee Name:");
    const payment = Number(prompt("Monthly Payment:")) || 0;
    if (!name || !name.trim()) return alert("Name is required");

    try {
      const res = await axios.post(API_URL, { name, payment });
      const newEmployees = [res.data, ...employees];
      setEmployees(newEmployees);
      recalcTotals(newEmployees);
    } catch (err) {
      console.error(err);
      alert("Error adding employee");
    }
  };

  const handleViewEmployee = (employeeId) => {
    navigate(`/employees/${employeeId}`);
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString();

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="container mt-4">

      {/* ===== HEADER ===== */}
      <div className="card shadow-lg mb-4 border-0" style={{ borderRadius: "15px" }}>
        <div className="card-body d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0" style={{ letterSpacing: "1px", color: "#1C1C1C" }}>Employees</h4>
          <button 
            className="btn btn-gradient shadow-sm"
            onClick={handleAddEmployee}
            style={{
              background: "linear-gradient(90deg, #0F2027, #203A43, #2C5364)",
              color: "#fff",
              fontWeight: "600",
              letterSpacing: "0.5px",
              borderRadius: "10px",
              padding: "0.5rem 1.2rem",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card shadow border-0 rounded-3" style={{ backgroundColor: "#D4AF37", color: "#000" }}>
            <div className="card-body text-center">
              <h6 className="text-uppercase fw-semibold">Total Payment</h6>
              <h4 className="fw-bold">RWF {formatNumber(totalPayment)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow border-0 rounded-3" style={{ backgroundColor: "#F28B82", color: "#000" }}>
            <div className="card-body text-center">
              <h6 className="text-uppercase fw-semibold">Total Loan</h6>
              <h4 className="fw-bold">RWF 0</h4>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow border-0 rounded-3" style={{ backgroundColor: "#0E6251", color: "#fff" }}>
            <div className="card-body text-center">
              <h6 className="text-uppercase fw-semibold">Total Remaining</h6>
              <h4 className="fw-bold">RWF 0</h4>
            </div>
          </div>
        </div>
      </div>

      {/* ===== EMPLOYEES TABLE ===== */}
      <div className="card shadow-lg border-0 rounded-4" style={{ overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="table table-hover text-center mb-0" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
            <thead style={{ backgroundColor: "#1C1C1C", color: "#fff", letterSpacing: "0.5px" }}>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Monthly Payment</th>
                <th>Total Loan</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">Loading...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="5">No employees found</td>
                </tr>
              ) : (
                employees.map((e, i) => (
                  <tr 
                    key={e.id} 
                    style={{ backgroundColor: "#F9F9F9", borderRadius: "10px", marginBottom: "8px" }}
                    className="shadow-sm"
                  >
                    <td>{i + 1}</td>
                    <td>
                      <span
                        style={{
                          color: "#0d6efd",
                          cursor: "pointer",
                          fontWeight: "600",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(ev) => ev.target.style.color = "#203A43"}
                        onMouseLeave={(ev) => ev.target.style.color = "#0d6efd"}
                        onClick={() => handleViewEmployee(e.id)}
                      >
                        {e.name}
                      </span>
                    </td>
                    <td>RWF {formatNumber(e.payment)}</td>
                    <td>RWF 0</td>
                    <td>RWF 0</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Employees;