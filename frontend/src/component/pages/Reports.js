import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

function Reports() {
  const { user } = useContext(AuthContext);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [branches, setBranches] = useState([]);

  // Fetch branches for the dropdown
  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      axios.get(`${process.env.REACT_APP_API_BASE_URL}/reports/branches`, { withCredentials: true })
        .then(res => setBranches(res.data.branches || []))
        .catch(err => console.error("Error fetching branches:", err));
    } else if (user?.branchId) {
      setSelectedBranch(user.branchId); // Admins are locked to their own branch
    }
  }, [user]);

  // Fetch Report Data whenever the branch selection changes
  useEffect(() => {
    fetchReportData(selectedBranch);
  }, [selectedBranch]);

  const fetchReportData = async (branchId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/reports/performance?branch_id=${branchId}`, {
        withCredentials: true
      });
      setReportData(res.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString() + " RWF";
  };

  const getDeptColor = (dept) => {
    switch (dept) {
      case "bar_products": return "primary";
      case "kitchen_products": return "warning";
      case "guesthouse": return "info";
      case "gym": return "success";
      case "billiard": return "secondary";
      default: return "dark";
    }
  };

  const formatDeptName = (dept) => {
    const names = {
      "bar_products": "Bar",
      "kitchen_products": "Kitchen",
      "guesthouse": "Guest House",
      "gym": "Gym Facility",
      "billiard": "Billiard",
      "management": "Management",
      "Other": "Other"
    };
    return names[dept] || dept;
  };

  if (loading && !reportData) {
    return <div className="text-center mt-5"><h4>Loading Performance Reports...</h4></div>;
  }

  return (
    <div className="container mt-4">
      {/* Header & Controls */}
      <div className="card shadow-lg mb-4 border-0" style={{ borderRadius: "15px" }}>
        <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-center">
          <h4 className="fw-bold mb-3 mb-md-0" style={{ color: "#1C1C1C" }}>
            <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
            Business Performance & Loss Report
          </h4>
          
          {user?.role === "SUPER_ADMIN" && (
            <div className="d-flex align-items-center">
              <label className="fw-bold me-2 text-muted">Filter by Branch:</label>
              <select 
                className="form-select shadow-sm"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{ width: "200px", borderRadius: "8px" }}
              >
                <option value="ALL">Global (All Branches)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.branch_id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {reportData ? (
        <>
          {/* KPI Summary Cards */}
          <div className="row g-4 mb-4">
            {/* Income */}
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "15px", borderLeft: "5px solid #28a745" }}>
                <div className="card-body text-center">
                  <h6 className="text-muted text-uppercase fw-bold mb-2">Total Gross Income</h6>
                  <h3 className="fw-bold text-success mb-0">{formatCurrency(reportData.summary?.total_income)}</h3>
                </div>
              </div>
            </div>
            
            {/* Business Loss */}
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "15px", borderLeft: "5px solid #dc3545" }}>
                <div className="card-body text-center">
                  <h6 className="text-muted text-uppercase fw-bold mb-2">Business Loss (Missing Stock)</h6>
                  <h3 className="fw-bold text-danger mb-0">{formatCurrency(reportData.summary?.business_loss)}</h3>
                  <small className="text-muted d-block mt-1">From Approved Requests</small>
                </div>
              </div>
            </div>

            {/* Recovered Loss */}
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "15px", borderLeft: "5px solid #17a2b8" }}>
                <div className="card-body text-center">
                  <h6 className="text-muted text-uppercase fw-bold mb-2">Recovered Loss (Penalties)</h6>
                  <h3 className="fw-bold text-info mb-0">{formatCurrency(reportData.summary?.recovered_loss)}</h3>
                  <small className="text-muted d-block mt-1">Deducted from Staff Salaries</small>
                </div>
              </div>
            </div>
          </div>

          {/* Department Breakdown Table */}
          <div className="card shadow-lg border-0" style={{ borderRadius: "15px", overflow: "hidden" }}>
            <div className="card-header bg-white pt-4 pb-3 border-bottom-0">
              <h5 className="fw-bold mb-0">Departmental Breakdown</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-center">
                <thead style={{ backgroundColor: "#1C1C1C", color: "#fff" }}>
                  <tr>
                    <th className="text-start px-4">Department</th>
                    <th>Gross Income</th>
                    <th>Business Loss</th>
                    <th>Recovered Loss</th>
                    <th>Net Impact Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.departments?.map((dept, i) => {
                    const totalLoss = dept.business_loss + dept.recovered_loss;
                    // Calculate what percentage of total loss was recovered
                    const recoveryRatio = totalLoss > 0 ? (dept.recovered_loss / totalLoss) * 100 : 0;
                    
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#F8F9FA" : "#FFFFFF" }}>
                        <td className="text-start px-4 fw-bold">
                          <span className={`badge bg-${getDeptColor(dept.department)} me-2 px-3 py-2`}>
                            {formatDeptName(dept.department)}
                          </span>
                        </td>
                        <td className="fw-semibold text-success">{formatCurrency(dept.income)}</td>
                        <td className="text-danger fw-semibold">{formatCurrency(dept.business_loss)}</td>
                        <td className="text-info fw-semibold">{formatCurrency(dept.recovered_loss)}</td>
                        <td>
                          {totalLoss > 0 ? (
                            <div className="progress mx-auto shadow-sm" style={{ height: "20px", width: "120px", borderRadius: "10px" }}>
                              <div 
                                className="progress-bar bg-info" 
                                role="progressbar" 
                                style={{ width: `${recoveryRatio}%` }} 
                                title={`Recovered: ${recoveryRatio.toFixed(1)}%`}
                              >
                                {recoveryRatio > 20 ? `${Math.round(recoveryRatio)}% Rec` : ''}
                              </div>
                              <div 
                                className="progress-bar bg-danger" 
                                role="progressbar" 
                                style={{ width: `${100 - recoveryRatio}%` }} 
                                title={`Lost: ${(100 - recoveryRatio).toFixed(1)}%`}
                              ></div>
                            </div>
                          ) : (
                            <span className="text-muted"><i className="bi bi-check-circle-fill text-success"></i> No Losses</span>
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
        <div className="alert alert-warning shadow-sm border-0" style={{ borderRadius: "10px" }}>
          No performance data available for the selected criteria.
        </div>
      )}
    </div>
  );
}

export default Reports;
