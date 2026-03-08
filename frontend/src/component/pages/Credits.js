import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

function Employees() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [deductions, setDeductions] = useState([]);
  const [loadingDeductions, setLoadingDeductions] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [totalPayment, setTotalPayment] = useState(0);

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/credits`;

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setEmployees(res.data.employees || []);
      recalcTotals(res.data.employees || []);
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
    const name = prompt("Employee Login Username (e.g., worker1):");
    const payment = Number(prompt("Base Monthly Salary (RWF):")) || 0;
    if (!name || !name.trim()) return alert("Username is required");

    try {
      const res = await axios.post(API_URL, { name, payment });
      const newEmployees = [res.data, ...employees];
      setEmployees(newEmployees);
      recalcTotals(newEmployees);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error adding employee");
    }
  };

  const handleViewEmployee = async (employee) => {
    setSelectedUser(employee);
    setLoadingDeductions(true);
    setDeductions([]); // reset before fetching
    try {
      const res = await axios.get(`${API_URL}/${employee.id}/deductions`);
      setDeductions(res.data);
    } catch (error) {
      console.error("Error fetching deductions", error);
    } finally {
      setLoadingDeductions(false);
    }
    // Show modal manually instead of relying on window.bootstrap which might be undefined
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
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
          <h4 className="fw-bold mb-0" style={{ letterSpacing: "1px", color: "#1C1C1C" }}>Staff & Employee Management</h4>
          {user?.role !== "MANAGER" && (
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
              + Add Employee (No Login)
            </button>
          )}
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card shadow border-0 rounded-3" style={{ backgroundColor: "#D4AF37", color: "#000" }}>
            <div className="card-body text-center">
              <h6 className="text-uppercase fw-semibold">Total Monthly Payroll</h6>
              <h4 className="fw-bold">RWF {formatNumber(totalPayment)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow border-0 rounded-3" style={{ backgroundColor: "#34495e", color: "#fff" }}>
            <div className="card-body text-center">
              <h6 className="text-uppercase fw-semibold">Total Staff Members</h6>
              <h4 className="fw-bold">{employees.length}</h4>
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
                <th>Username</th>
                <th>System Role</th>
                <th>Base Monthly Salary</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">Loading...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="4">No staff found</td>
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
                          textDecoration: "underline",
                          textUnderlineOffset: "3px"
                        }}
                        onMouseEnter={(ev) => ev.target.style.color = "#203A43"}
                        onMouseLeave={(ev) => ev.target.style.color = "#0d6efd"}
                        onClick={() => handleViewEmployee(e)}
                      >
                         {e.name}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${e.role === 'EMPLOYEE' ? 'bg-secondary' : 'bg-primary'}`}>
                        {e.role}
                      </span>
                    </td>
                    <td className="fw-bold text-success">RWF {formatNumber(e.payment)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== EMPLOYEE DETAILS MODAL ===== */}
      <div 
        className={`modal fade ${showModal ? "show" : ""}`} 
        id="employeeModal" 
        tabIndex="-1" 
        style={{ display: showModal ? "block" : "none", backgroundColor: showModal ? "rgba(0,0,0,0.6)" : "transparent" }}
        aria-hidden={!showModal}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg rounded-4">
            
            {/* Modal Header */}
            <div className="modal-header text-white" style={{ background: "linear-gradient(135deg, #1C1C1C, #34495e)" }}>
              <h5 className="modal-title fw-bold">
                <i className="bi bi-person-badge me-2"></i> 
                {selectedUser ? `${selectedUser.name}'s Profile` : 'Loading...'}
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal} aria-label="Close"></button>
            </div>

            {/* Modal Body */}
            <div className="modal-body p-4 bg-light">
              {selectedUser && (
                <>
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3 mb-md-0">
                      <div className="card shadow-sm border-0 h-100 p-3 pt-4 text-center rounded-4">
                         <h6 className="text-muted text-uppercase fw-semibold mb-1">Current Base Salary</h6>
                         <h3 className="fw-bold text-success mb-0">RWF {formatNumber(selectedUser.payment)}</h3>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card shadow-sm border-0 h-100 p-3 pt-4 text-center rounded-4">
                         <h6 className="text-muted text-uppercase fw-semibold mb-1">System Role</h6>
                         <h4 className="fw-bold text-dark mb-0">{selectedUser.role}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Deduction Ledger */}
                  <div className="card shadow-sm border-0 rounded-4">
                    <div className="card-header bg-white border-bottom-0 pt-4 pb-2">
                       <h5 className="fw-bold text-danger mb-0">
                         <i className="bi bi-receipt me-2"></i> Deduction Ledger
                       </h5>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive" style={{ maxHeight: "250px" }}>
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light sticky-top">
                            <tr>
                              <th className="px-4">Date</th>
                              <th>Reason</th>
                              <th className="text-end px-4">Amount Deducted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingDeductions ? (
                              <tr><td colSpan="3" className="text-center py-4 text-muted">Loading logs...</td></tr>
                            ) : deductions.length === 0 ? (
                              <tr><td colSpan="3" className="text-center py-4 text-muted">No deductions on record. Clean sheet! 🎉</td></tr>
                            ) : (
                              deductions.map(ded => (
                                <tr key={ded.id}>
                                  <td className="px-4 text-muted" style={{ fontSize: "0.9rem" }}>
                                    {new Date(ded.date).toLocaleDateString()} <br/>
                                    <small>{new Date(ded.date).toLocaleTimeString()}</small>
                                  </td>
                                  <td>{ded.reason}</td>
                                  <td className="text-end px-4 text-danger fw-bold">- RWF {formatNumber(ded.amount)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer bg-white rounded-bottom-4 border-top-0 pt-0 pb-4 px-4 d-flex justify-content-between">
              <button 
                type="button" 
                className="btn btn-outline-secondary rounded-pill px-4 fw-bold" 
                onClick={handleCloseModal}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold"
                style={{ background: "#203A43", border: "none" }}
                onClick={() => {
                  handleCloseModal();
                  navigate(`/employees/${selectedUser.id}/loans`);
                }}
              >
                View Cash Loans History <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

export default Employees;