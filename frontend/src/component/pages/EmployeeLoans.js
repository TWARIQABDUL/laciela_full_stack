import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaPlus, FaCalendarAlt, FaHistory, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import "../../style/premium-pages.css";

function EmployeeLoans() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [employee, setEmployee] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalLoan, setTotalLoan] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLoan, setNewLoan] = useState({
    amount: "", reason: "", loan_date: new Date().toISOString().split("T")[0]
  });

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/credits`;

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      const [employeeRes, loansRes] = await Promise.all([
        axios.get(`${API_URL}`, { withCredentials: true }), 
        axios.get(`${API_URL}/${id}/loans`, { withCredentials: true }), 
      ]);

      const emp = employeeRes.data.employees?.find((e) => e.id === Number(id)) || {};
      setEmployee(emp);
      setLoans(loansRes.data);
      
      let loanSum = 0;
      let remainingSum = 0;
      loansRes.data.forEach((l) => {
        loanSum += Number(l.amount || 0);
        remainingSum += Number(l.remaining || 0);
      });
      setTotalLoan(loanSum);
      setTotalRemaining(remainingSum);
    } catch (err) {
      console.error(err);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL, id]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!newLoan.amount || !newLoan.loan_date) return alert("Amount and Date are required");

    try {
      const res = await axios.post(`${API_URL}/${id}/loans`, newLoan, { withCredentials: true });
      const updatedLoans = [res.data, ...loans];
      setLoans(updatedLoans);
      
      // Update totals locally
      setTotalLoan(prev => prev + Number(newLoan.amount));
      setTotalRemaining(prev => prev + Number(newLoan.amount));
      
      setShowAddModal(false);
      setNewLoan({ amount: "", reason: "", loan_date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      alert("Error adding loan");
    }
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString();

  return (
    <div className="premium-container">
      
      {/* HEADER SECTION */}
      <div className="controls-card">
        <div className="d-flex align-items-center">
          <button className="icon-btn me-3" onClick={() => navigate("/credits")} title="Back">
            <FaArrowLeft/>
          </button>
          <div>
            <h2 className="page-title">{employee.name || "Employee"}'s Finances</h2>
            <p className="text-muted mb-0 small text-uppercase fw-bold tracking-wider">Loan Disbursement & Recovery Ledger</p>
          </div>
        </div>

        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          <FaPlus className="me-2"/> Disburse New Loan
        </button>
      </div>

      {/* KPI SUMMARY */}
      <div className="stats-row">
        <div className="stats-card-premium" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color:'white'}}>
          <div className="d-flex w-100 justify-content-between align-items-start mb-3">
             <h6 className="opacity-75">Cumulative Borrows</h6>
             <FaHistory/>
          </div>
          <h4 className="w-100 text-start">{formatNumber(totalLoan)} RWF</h4>
          <p className="w-100 text-start small mb-0 mt-2 opacity-75">Total funds ever disbursed</p>
        </div>

        <div className="stats-card-premium" style={{background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)', color:'white'}}>
          <div className="d-flex w-100 justify-content-between align-items-start mb-3">
             <h6 className="opacity-75">Outstanding Debt</h6>
             <FaExclamationTriangle/>
          </div>
          <h4 className="w-100 text-start">{formatNumber(totalRemaining)} RWF</h4>
          <p className="w-100 text-start small mb-0 mt-2 opacity-75">Awaiting recovery from salary</p>
        </div>

        <div className="stats-card-premium" style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color:'white'}}>
          <div className="d-flex w-100 justify-content-between align-items-start mb-3">
             <h6 className="opacity-75">Status</h6>
             <FaCheckCircle/>
          </div>
          <h4 className="w-100 text-start">{totalRemaining > 0 ? "In Recovery" : "Debt Free"}</h4>
          <p className="w-100 text-start small mb-0 mt-2 opacity-75">Fiscal standing assessment</p>
        </div>
      </div>

      {/* LOANS TABLE */}
      <div className="premium-table-card">
        <div className="table-responsive">
          <table className="table premium-table mb-0">
            <thead>
              <tr>
                <th className="ps-4">Disbursement Date</th>
                <th>Justification / Reason</th>
                <th>Principal Amount</th>
                <th>Unpaid Balance</th>
                <th className="pe-4">Recovery Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5">Accessing fiscal archives...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No active or past loans found.</td></tr>
              ) : (
                loans.map((l) => (
                  <tr key={l.id}>
                    <td className="ps-4">
                       <div className="d-flex align-items-center">
                          <FaCalendarAlt className="text-muted me-2"/>
                          <span className="fw-bold">{l.loan_date}</span>
                       </div>
                    </td>
                    <td className="text-muted">{l.reason || 'N/A'}</td>
                    <td className="fw-bold">{formatNumber(l.amount)} RWF</td>
                    <td className="fw-bold text-danger">{formatNumber(l.remaining)} RWF</td>
                    <td className="pe-4">
                       {l.remaining <= 0 ? (
                         <span className="badge bg-success-soft text-success rounded-pill px-3">Settled</span>
                       ) : (
                         <span className="badge bg-danger-soft text-danger rounded-pill px-3">Active Deduction</span>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD LOAN MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="premium-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium" style={{background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)'}}>
              <h5 className="mb-0 fw-bold">Disburse Cash Loan</h5>
              <button className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
            </div>
            <form onSubmit={handleCreateLoan} className="p-4">
               <div className="row g-3">
                 <div className="col-12">
                    <label className="form-label small fw-bold text-uppercase">Principal Loan Amount (RWF)</label>
                    <input 
                      type="number" className="form-control premium-input text-danger fw-bold fs-4" required
                      value={newLoan.amount} onChange={e => setNewLoan({...newLoan, amount: e.target.value})}
                      placeholder="0.00"
                    />
                 </div>
                 <div className="col-md-7">
                    <label className="form-label small fw-bold text-uppercase">Justification / Reason</label>
                    <input 
                      type="text" className="form-control premium-input"
                      value={newLoan.reason} onChange={e => setNewLoan({...newLoan, reason: e.target.value})}
                      placeholder="e.g. Medical emergency"
                    />
                 </div>
                 <div className="col-md-5">
                    <label className="form-label small fw-bold text-uppercase">Transaction Date</label>
                    <input 
                      type="date" className="form-control premium-input" required
                      value={newLoan.loan_date} onChange={e => setNewLoan({...newLoan, loan_date: e.target.value})}
                    />
                 </div>
               </div>
               <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light me-2 rounded-pill px-4" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="add-btn px-5" style={{background:'#b91c1c'}}>Confirm Disbursement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .bg-success-soft { background-color: rgba(16, 185, 129, 0.1); }
        .bg-danger-soft { background-color: rgba(185, 28, 28, 0.1); }
        .avatar-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .icon-btn { border: none; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 12px; transition: all 0.2s; }
        .icon-btn:hover { background: rgba(0,0,0,0.1); transform: translateX(-2px); }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1050; }
        .premium-modal { background: white; border-radius: 20px; width: 90%; max-width: 550px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; }
        .modal-header-premium { padding: 20px; color: white; display: flex; justify-content: space-between; align-items: center; }
        .premium-input { border-radius: 10px; padding: 10px 15px; border: 1px solid #e2e8f0; font-size: 0.9rem; }
      `}</style>

    </div>
  );
}

export default EmployeeLoans;