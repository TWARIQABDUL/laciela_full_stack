import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function EmployeeLoans() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [employee, setEmployee] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalLoan, setTotalLoan] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/credits`; // your backend URL

  // ===== Fetch employee loans =====
  const fetchLoans = async () => {
    try {
      setLoading(true);
      const [employeeRes, loansRes] = await Promise.all([
        axios.get(`${API_URL}`), // fetch all employees
        axios.get(`${API_URL}/${id}/loans`), // fetch this employee's loans
      ]);

      // Find current employee
      const emp = employeeRes.data.find((e) => e.id === Number(id)) || {};
      setEmployee(emp);
      setLoans(loansRes.data);
      recalcTotals(loansRes.data);
    } catch (err) {
      console.error(err);
      setLoans([]);
      setTotalLoan(0);
      setTotalRemaining(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [id]);

  // ===== Recalculate totals =====
  const recalcTotals = (data) => {
    let loanSum = 0;
    let remainingSum = 0;

    data.forEach((l) => {
      loanSum += Number(l.amount || 0);
      remainingSum += Number(l.remaining || 0);
    });

    setTotalLoan(loanSum);
    setTotalRemaining(remainingSum);
  };

  // ===== Add new loan =====
  const handleAddLoan = async () => {
    const amount = Number(prompt("Amount Taken:")) || 0;
    const reason = prompt("Reason:");
    const date = prompt("Date (YYYY-MM-DD):", new Date().toISOString().split("T")[0]);

    if (!amount || !date) return alert("Amount and Date are required");

    try {
      const res = await axios.post(`${API_URL}/${id}/loans`, {
        amount,
        reason,
        loan_date: date,
      });
      const newLoans = [res.data, ...loans];
      setLoans(newLoans);
      recalcTotals(newLoans);
    } catch (err) {
      console.error(err);
      alert("Error adding loan");
    }
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString();

  return (
    <div className="container mt-4">

      {/* ===== HEADER ===== */}
      <div className="card shadow-lg mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0" style={{ fontFamily: "Poppins, sans-serif" }}>
            {employee.name || "Employee"} - Loans
          </h4>
          <button className="btn btn-success shadow-sm" onClick={handleAddLoan}>
            + Add Loan
          </button>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card shadow border-0" style={{ backgroundColor: "#F28B82", color: "#000", borderRadius: "12px" }}>
            <div className="card-body text-center">
              <h6 className="fw-medium">Total Loan</h6>
              <h4 className="fw-bold">RWF {formatNumber(totalLoan)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow border-0" style={{ backgroundColor: "#0E6251", color: "#fff", borderRadius: "12px" }}>
            <div className="card-body text-center">
              <h6 className="fw-medium">Total Remaining</h6>
              <h4 className="fw-bold">RWF {formatNumber(totalRemaining)}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LOANS TABLE ===== */}
      <div className="card shadow-lg">
        <div className="table-responsive">
          <table className="table table-bordered table-hover text-center mb-0">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Amount Taken</th>
                <th>Reason</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5">Loading...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan="5">No loans found</td></tr>
              ) : (
                loans.map((l, i) => (
                  <tr
                    key={l.id}
                    style={{ transition: "all 0.2s", cursor: "pointer" }}
                    onMouseEnter={(ev) => ev.currentTarget.style.backgroundColor = "#f8f9fa"}
                    onMouseLeave={(ev) => ev.currentTarget.style.backgroundColor = ""}
                  >
                    <td>{i + 1}</td>
                    <td>{l.loan_date}</td>
                    <td>RWF {formatNumber(l.amount)}</td>
                    <td>{l.reason}</td>
                    <td className={l.remaining >= 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                      RWF {formatNumber(l.remaining)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button
        className="btn btn-secondary mt-3 shadow-sm"
        onClick={() => navigate("/credits")}
      >
        ← Back to Employees
      </button>
    </div>
  );
}

export default EmployeeLoans;