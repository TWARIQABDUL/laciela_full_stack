import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaUsers, FaPlus, FaMoneyBillWave, FaUserShield, FaSchool, FaEye, FaArrowRight, FaIdBadge } from "react-icons/fa";
import "../../style/premium-pages.css";

const SYSTEM_ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "BAR_MAN", label: "Barman" },
  { value: "CHIEF_KITCHEN", label: "Chef" },
  { value: "TOKEN_MAN", label: "Token Man" },
  { value: "LAND_LORD", label: "Land Lord" },
  { value: "GYM", label: "Gym Staff" },
  { value: "EMPLOYEE", label: "General Employee (No Login)" },
];

function Employees() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);

  // Modals & Selection
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Add User Form State
  const [newUser, setNewUser] = useState({
    username: "", password: "", role: "EMPLOYEE", branch_id: "", payment: ""
  });

  const [deductions, setDeductions] = useState([]);
  const [loadingDeductions, setLoadingDeductions] = useState(false);
  const [totalPayroll, setTotalPayroll] = useState(0);

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/credits`;

  const fetchBranches = useCallback(async () => {
    if (user?.role !== "SUPER_ADMIN") return;
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/reports/branches`, { withCredentials: true });
      setBranches(res.data.branches || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  }, [user]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, { withCredentials: true });
      const data = res.data.employees || [];
      setEmployees(data);
      setTotalPayroll(data.reduce((sum, e) => sum + Number(e.payment || 0), 0));
    } catch (err) {
      console.error(err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
      fetchBranches();
    }
  }, [isAuthenticated, fetchEmployees, fetchBranches, location.pathname]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username) return alert("Username is required");
    try {
      const res = await axios.post(API_URL, newUser, { withCredentials: true });
      setEmployees([res.data, ...employees]);
      setTotalPayroll(prev => prev + Number(newUser.payment || 0));
      setShowAddModal(false);
      setNewUser({ username: "", password: "", role: "EMPLOYEE", branch_id: "", payment: "" });
    } catch (err) {
      alert(err.response?.data?.error || "Error creating user");
    }
  };

  const handleViewEmployee = async (employee) => {
    setSelectedUser(employee);
    setLoadingDeductions(true);
    setDeductions([]);
    setShowViewModal(true);
    try {
      const res = await axios.get(`${API_URL}/${employee.id}/deductions`, { withCredentials: true });
      setDeductions(res.data);
    } catch (error) {
      console.error("Error fetching deductions", error);
    } finally {
      setLoadingDeductions(false);
    }
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString();

  return (
    <div className="premium-container">
      
      {/* HEADER & TOP SUMMARY */}
      <div className="controls-card">
        <div className="d-flex align-items-center">
          <div className="p-3 rounded-circle me-3" style={{background: 'rgba(99, 102, 241, 0.1)', color:'#6366f1'}}>
            <FaUsers size={24}/>
          </div>
          <div>
            <h2 className="page-title">Staff Management</h2>
            <p className="text-muted mb-0 small text-uppercase fw-bold tracking-wider">Payroll & Access Control Center</p>
          </div>
        </div>

        {user?.role !== "MANAGER" && (
          <button className="add-btn" onClick={() => setShowAddModal(true)}>
            <FaPlus className="me-2"/> Add User / Account
          </button>
        )}
      </div>

      {/* KPI SUMMARY */}
      <div className="stats-row">
        <div className="stats-card-premium" style={{background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', color:'white'}}>
          <div className="d-flex w-100 justify-content-between align-items-start mb-3">
             <h6 className="opacity-75">Monthly Payroll</h6>
             <FaMoneyBillWave/>
          </div>
          <h4 className="w-100 text-start">{formatNumber(totalPayroll)} RWF</h4>
          <p className="w-100 text-start small mb-0 mt-2 opacity-75">Total obligation for {employees.length} staff</p>
        </div>

        <div className="stats-card-premium" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color:'white'}}>
          <div className="d-flex w-100 justify-content-between align-items-start mb-3">
             <h6 className="opacity-75">Active Accounts</h6>
             <FaUserShield/>
          </div>
          <h4 className="w-100 text-start">{employees.filter(e => e.role !== 'EMPLOYEE').length}</h4>
          <p className="w-100 text-start small mb-0 mt-2 opacity-75">System login users</p>
        </div>

        <div className="stats-card-premium" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color:'white'}}>
          <div className="d-flex w-100 justify-content-between align-items-start mb-3">
             <h6 className="opacity-75">Branch Presence</h6>
             <FaSchool/>
          </div>
          <h4 className="w-100 text-start">{[...new Set(employees.map(e => e.branch_id))].length}</h4>
          <p className="w-100 text-start small mb-0 mt-2 opacity-75">Distributed across units</p>
        </div>
      </div>

      {/* STAFF TABLE */}
      <div className="premium-table-card">
        <div className="table-responsive">
          <table className="table premium-table mb-0">
            <thead>
              <tr>
                <th className="text-start ps-4">Identification</th>
                <th>System Role</th>
                <th>Location / Branch</th>
                <th>Monthly Basis</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5">Loading digital identities...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5">No staff records found in global registry.</td></tr>
              ) : (
                employees.map((e) => (
                  <tr key={e.id}>
                    <td className="text-start ps-4">
                      <div className="d-flex align-items-center">
                        <div className="avatar-circle me-3" style={{background: '#f1f5f9', color: '#64748b', fontWeight:'700'}}>
                          {e.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold">{e.name}</div>
                          <div className="small text-muted">ID: {String(e.id).padStart(4,'0')}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge rounded-pill px-3 py-2 ${e.role === 'SUPER_ADMIN' ? 'bg-danger' : (e.role === 'EMPLOYEE' ? 'bg-light text-dark' : 'bg-primary')}`}>
                         {e.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td><span className="text-muted"><FaSchool className="me-1"/> {e.branch_name || 'Global HQ'}</span></td>
                    <td className="fw-bold text-success">{formatNumber(e.payment)} RWF</td>
                    <td>
                      <button className="icon-btn text-primary me-2" onClick={() => handleViewEmployee(e)} title="Profile View">
                        <FaEye/>
                      </button>
                      <button className="icon-btn text-dark" onClick={() => navigate(`/employees/${e.id}/loans`)} title="Finances">
                        <FaArrowRight/>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="premium-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h5 className="mb-0 fw-bold">Register New Staff / User</h5>
              <button className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-uppercase">Identification (Username)</label>
                  <input 
                    type="text" className="form-control premium-input" required 
                    value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                    placeholder="e.g. john_doe"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-uppercase">Access Secret (Password)</label>
                  <input 
                    type="password" className="form-control premium-input"
                    value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Min 6 chars"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-uppercase">Base Salary (RWF)</label>
                  <input 
                    type="number" className="form-control premium-input"
                    value={newUser.payment} onChange={e => setNewUser({...newUser, payment: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-uppercase">System Role</label>
                  <select 
                    className="form-select premium-input"
                    value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    {SYSTEM_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-uppercase">Assigned Branch</label>
                  <select 
                    className="form-select premium-input"
                    value={newUser.branch_id} onChange={e => setNewUser({...newUser, branch_id: e.target.value})}
                  >
                    <option value="">Global / Select Branch</option>
                    {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light me-2 rounded-pill px-4" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="add-btn px-5">Finalize Registration</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="premium-modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'}}>
              <h5 className="mb-0 fw-bold"><FaIdBadge className="me-2"/> Employee Dossier: {selectedUser?.name}</h5>
              <button className="btn-close btn-close-white" onClick={() => setShowViewModal(false)}></button>
            </div>
            <div className="p-4">
               {selectedUser && (
                 <>
                   <div className="row g-4 mb-4">
                     <div className="col-md-4">
                        <div className="p-3 rounded-4 bg-light text-center shadow-sm">
                           <h6 className="text-muted small text-uppercase mb-1">Role</h6>
                           <div className="fw-bold text-dark">{selectedUser.role}</div>
                        </div>
                     </div>
                     <div className="col-md-4">
                        <div className="p-3 rounded-4 bg-light text-center shadow-sm">
                           <h6 className="text-muted small text-uppercase mb-1">Monthly Salary</h6>
                           <div className="fw-bold text-success">{formatNumber(selectedUser.payment)} RWF</div>
                        </div>
                     </div>
                     <div className="col-md-4">
                        <div className="p-3 rounded-4 bg-light text-center shadow-sm">
                           <h6 className="text-muted small text-uppercase mb-1">Branch Unit</h6>
                           <div className="fw-bold text-primary">{selectedUser.branch_name || 'Main Registry'}</div>
                        </div>
                     </div>
                   </div>

                   <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                      <div className="p-3 bg-danger text-white d-flex align-items-center">
                         <FaMoneyBillWave className="me-2"/> Deduction History (Fines & Penalties)
                      </div>
                      <div className="table-responsive" style={{maxHeight:'300px'}}>
                        <table className="table table-hover mb-0">
                          <thead className="table-light">
                            <tr>
                              <th className="ps-4">Timestamp</th>
                              <th>Justification</th>
                              <th className="text-end pe-4">Reduction</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingDeductions ? (
                              <tr><td colSpan="3" className="text-center py-4">Accessing ledger...</td></tr>
                            ) : deductions.length === 0 ? (
                              <tr><td colSpan="3" className="text-center py-4 text-muted small">No disciplinary reductions found. Excellent status.</td></tr>
                            ) : (
                              deductions.map(ded => (
                                <tr key={ded.id}>
                                  <td className="ps-4 small text-muted">{new Date(ded.date).toLocaleString()}</td>
                                  <td>{ded.reason}</td>
                                  <td className="text-end pe-4 fw-bold text-danger">- {formatNumber(ded.amount)} RWF</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                   </div>

                   <div className="d-flex justify-content-between mt-4">
                      <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowViewModal(false)}>Close Dossier</button>
                      <button className="add-btn" onClick={() => navigate(`/employees/${selectedUser.id}/loans`)}>
                        Detailed Finance History <FaArrowRight className="ms-2"/>
                      </button>
                   </div>
                 </>
               )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }
        .icon-btn {
          border: none;
          background: rgba(0,0,0,0.05);
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .icon-btn:hover { background: rgba(0,0,0,0.1); transform: translateY(-2px); }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }
        .premium-modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }
        .modal-lg { max-width: 800px; }
        .modal-header-premium {
          padding: 20px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .premium-input {
          border-radius: 10px;
          padding: 10px 15px;
          border: 1px solid #e2e8f0;
          font-size: 0.9rem;
        }
        .premium-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1); }
      `}</style>

    </div>
  );
}

export default Employees;