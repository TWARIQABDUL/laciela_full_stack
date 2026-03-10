import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { FaChartLine, FaArrowUp, FaArrowDown, FaExchangeAlt, FaFilter, FaExclamationTriangle } from "react-icons/fa";
import "../../style/premium-pages.css";

function Reports() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [branches, setBranches] = useState([]);

  const API_URL = process.env.REACT_APP_API_BASE_URL;

  const fetchBranches = useCallback(async () => {
    if (user?.role !== "SUPER_ADMIN") return;
    try {
      const res = await axios.get(`${API_URL}/reports/branches`, { withCredentials: true });
      setBranches(res.data.branches || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  }, [user, API_URL]);

  const fetchReportData = useCallback(async (branchId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/reports/performance?branch_id=${branchId}`, {
        withCredentials: true
      });
      setReportData(res.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBranches();
      if (user.role !== "SUPER_ADMIN" && user.branchId) {
        setSelectedBranch(user.branchId);
      }
    }
  }, [isAuthenticated, user, fetchBranches]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReportData(selectedBranch);
    }
  }, [selectedBranch, isAuthenticated, fetchReportData]);

  const formatCurrency = (val) => Number(val || 0).toLocaleString() + " RWF";

  const getDeptColor = (dept) => {
    const map = {
      "bar_products": "#3b82f6",
      "kitchen_products": "#f59e0b",
      "guesthouse": "#06b6d4",
      "gym": "#10b981",
      "billiard": "#8b5cf6",
      "management": "#64748b"
    };
    return map[dept] || "#1e293b";
  };

  const formatDeptName = (dept) => {
    const names = {
      "bar_products": "Bar",
      "kitchen_products": "Kitchen",
      "guesthouse": "Guest House",
      "gym": "Gym Facility",
      "billiard": "Billiard",
      "management": "Management",
    };
    return names[dept] || dept;
  };

  return (
    <div className="premium-container">
      
      {/* HEADER SECTION */}
      <div className="controls-card">
        <div className="d-flex align-items-center">
          <div className="p-3 rounded-circle me-3" style={{background: 'rgba(59, 130, 246, 0.1)', color:'#3b82f6'}}>
            <FaChartLine size={24}/>
          </div>
          <div>
            <h2 className="page-title">Performance Analytics</h2>
            <p className="text-muted mb-0 small text-uppercase fw-bold tracking-wider">Business Impact & Loss Recovery Report</p>
          </div>
        </div>

        {user?.role === "SUPER_ADMIN" && (
          <div className="date-controls" style={{background: 'white', border: '1px solid #e2e8f0'}}>
            <FaFilter className="text-muted me-2"/>
            <select 
              className="form-select border-0 shadow-none fw-bold"
              style={{ width: "220px", background:'transparent', fontSize:'0.9rem' }}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="ALL">Global Network</option>
              {branches.map(b => (
                <option key={b.branch_id} value={b.branch_id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && !reportData ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3"></div>
          <p className="text-muted">Generating premium insights...</p>
        </div>
      ) : reportData ? (
        <>
          {/* KPI DASHBOARD */}
          <div className="stats-row">
            <div className="stats-card-premium" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color:'white'}}>
              <div className="d-flex w-100 justify-content-between align-items-start mb-3">
                <h6 className="opacity-75">Gross Revenue</h6>
                <FaArrowUp className="text-success"/>
              </div>
              <h4 className="w-100 text-start">{formatCurrency(reportData.summary?.total_income)}</h4>
              <div className="progress w-100 mt-3" style={{height:'4px', background:'rgba(255,255,255,0.1)'}}>
                <div className="progress-bar bg-success" style={{width: '85%'}}></div>
              </div>
            </div>

            <div className="stats-card-premium" style={{background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color:'white'}}>
              <div className="d-flex w-100 justify-content-between align-items-start mb-3">
                <h6 className="opacity-75">Business Loss</h6>
                <FaArrowDown className="text-white opacity-50"/>
              </div>
              <h4 className="w-100 text-start">{formatCurrency(reportData.summary?.business_loss)}</h4>
              <p className="w-100 text-start small mb-0 mt-2 opacity-75">Stock discrepancies & errors</p>
            </div>

            <div className="stats-card-premium" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color:'white'}}>
              <div className="d-flex w-100 justify-content-between align-items-start mb-3">
                <h6 className="opacity-75">Recovered Loss</h6>
                <FaExchangeAlt/>
              </div>
              <h4 className="w-100 text-start">{formatCurrency(reportData.summary?.recovered_loss)}</h4>
              <p className="w-100 text-start small mb-0 mt-2 opacity-75">Staff-compensated penalties</p>
            </div>
          </div>

          {/* DEPARTMENT BREAKDOWN */}
          <div className="premium-table-card">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Departmental Intelligence</h5>
              <span className="badge bg-light text-dark px-3 py-2 rounded-pill shadow-sm">Real-time Data</span>
            </div>
            <div className="table-responsive">
              <table className="table premium-table mb-0">
                <thead>
                  <tr>
                    <th className="text-start ps-4">Department</th>
                    <th>Revenue Stream</th>
                    <th>Theoretical Loss</th>
                    <th>Recovery Value</th>
                    <th>Net Recovery %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.departments?.map((dept, i) => {
                    const totalLoss = dept.business_loss + dept.recovered_loss;
                    const recoveryRatio = totalLoss > 0 ? (dept.recovered_loss / totalLoss) * 100 : 0;
                    
                    return (
                      <tr key={i}>
                        <td className="text-start ps-4">
                          <div className="d-flex align-items-center">
                            <div className="rounded-2 me-3" style={{width:'8px', height:'24px', background: getDeptColor(dept.department)}}></div>
                            <span className="fw-bold">{formatDeptName(dept.department)}</span>
                          </div>
                        </td>
                        <td className="fw-bold text-success">{formatCurrency(dept.income)}</td>
                        <td className="fw-bold text-danger">{formatCurrency(dept.business_loss)}</td>
                        <td className="fw-bold text-info">{formatCurrency(dept.recovered_loss)}</td>
                        <td>
                          {totalLoss > 0 ? (
                            <div className="d-flex align-items-center justify-content-center">
                              <div className="progress flex-grow-1 mx-3" style={{ height: "8px", borderRadius: "10px", maxWidth:'100px' }}>
                                <div 
                                  className="progress-bar" 
                                  style={{ width: `${recoveryRatio}%`, background: '#10b981' }} 
                                ></div>
                              </div>
                              <span className="fw-bold small">{Math.round(recoveryRatio)}%</span>
                            </div>
                          ) : (
                            <span className="badge bg-success-soft text-success rounded-pill px-3">Stable</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="controls-card justify-content-center text-center py-5">
           <div>
             <FaExclamationTriangle size={40} className="text-warning mb-3"/>
             <h5 className="fw-bold">No data found for this period</h5>
             <p className="text-muted">Try selecting a different branch or check if stock has been entered.</p>
           </div>
        </div>
      )}

      <style>{`
        .bg-success-soft { background-color: rgba(16, 185, 129, 0.1); }
        .tracking-wider { letter-spacing: 0.1em; }
      `}</style>
    </div>
  );
}

export default Reports;
