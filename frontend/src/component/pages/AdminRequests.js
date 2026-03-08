import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

function AdminRequests() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // For approval modal info
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);

  // For rejection modal info
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [calculatedLoss, setCalculatedLoss] = useState(0);

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/requests`;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchRequests();
    }
  }, [isSuperAdmin]);

  const handleApproveClick = (reqItem) => {
    setActiveRequest(reqItem);
    setShowApprovalModal(true);
  };

  const confirmApprove = async () => {
    try {
      await axios.put(`${API_URL}/${activeRequest.id}/approve`);
      alert("Request approved and table updated successfully.");
      setShowApprovalModal(false);
      setActiveRequest(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to approve request.");
    }
  };

  const handleRejectClick = (reqItem) => {
    setActiveRequest(reqItem);
    const diff = reqItem.old_sold - reqItem.new_sold;
    const loss = diff * reqItem.price;
    setCalculatedLoss(loss);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason) return;

    try {
      await axios.put(`${API_URL}/${activeRequest.id}/reject`, {
        requester_username: activeRequest.requester_username,
        financial_loss: calculatedLoss > 0 ? calculatedLoss : 0,
        rejection_reason: rejectReason
      });

      alert("Request rejected. Loss deducted from requester's salary.");
      setShowRejectModal(false);
      setActiveRequest(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to reject request.");
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="container mt-5 text-center">
        <h3 className="text-danger">Access Denied</h3>
        <p>You do not have permission to view pending data change requests.</p>
      </div>
    );
  }

  const formatNumber = (value) => Number(value || 0).toLocaleString();

  return (
    <div className="container mt-4">
      <div className="card shadow-lg mb-4 border-0">
        <div className="card-body">
          <h4 className="fw-bold mb-0 text-primary">Pending Change Requests</h4>
          <p className="text-muted mb-0">Review requests from staff to edit locked sales records.</p>
        </div>
      </div>

      <div className="card shadow border-0 rounded-4">
        <div className="table-responsive">
          <table className="table table-hover text-center mb-0" style={{borderCollapse:"separate",borderSpacing:"0 8px"}}>
            <thead style={{background:"#1C1C1C",color:"#fff"}}>
              <tr>
                <th>Req ID</th>
                <th>Requested By</th>
                <th>Date Submitted</th>
                <th>Module / Date</th>
                <th>Product</th>
                <th>Current Sold</th>
                <th>Requested Sold</th>
                <th>Price</th>
                <th>Difference (Loss)</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11">Loading requests...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="11">No pending requests.</td></tr>
              ) : (
                requests.map((r) => {
                  const itemsDiff = r.old_sold - r.new_sold;
                  const monetaryDiff = itemsDiff * r.price;

                  return (
                    <tr key={r.id} className="shadow-sm" style={{background:"#F9F9F9", borderRadius:"10px"}}>
                      <td>#{r.id}</td>
                      <td>
                        <span className="fw-bold text-primary">👤 {r.requester_username}</span>
                      </td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td>
                        <span className="badge bg-secondary">{r.module}</span><br />
                        <small className="text-muted">{r.record_date}</small>
                      </td>
                      <td className="fw-bold">{r.product_name}</td>
                      <td>
                        <span className="text-danger fw-bold">{r.old_sold} items</span>
                      </td>
                      <td>
                        <span className="text-success fw-bold">{r.new_sold} items</span>
                      </td>
                      <td>{formatNumber(r.price)} RWF</td>
                      <td>
                        {itemsDiff > 0 ? (
                          <span className="text-danger fw-bold">-{formatNumber(monetaryDiff)} RWF</span>
                        ) : (
                          <span className="text-success fw-bold">+{formatNumber(Math.abs(monetaryDiff))} RWF</span>
                        )}
                      </td>
                      <td style={{maxWidth: "200px", whiteSpace: "normal"}} className="text-start fst-italic">
                        "{r.reason}"
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button className="btn btn-sm btn-success" onClick={() => handleApproveClick(r)}>Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleRejectClick(r)}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVAL MODAL */}
      {showApprovalModal && activeRequest && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title fw-bold">Approve Request #{activeRequest.id}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowApprovalModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p>Request submitted by <strong>👤 {activeRequest.requester_username}</strong></p>
                  <p>Are you sure you want to approve this change for <strong>{activeRequest.product_name}</strong>?</p>
                  <ul>
                    <li><strong>Old Sold Count:</strong> {activeRequest.old_sold}</li>
                    <li><strong className="text-success">New Sold Count:</strong> {activeRequest.new_sold}</li>
                  </ul>
                  <p className="text-muted small">Approving this request will automatically update the record in the <code>{activeRequest.module}</code> table.</p>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowApprovalModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-success" onClick={confirmApprove}>Confirm Approval</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* REJECTION / PENALTY MODAL */}
      {showRejectModal && activeRequest && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title fw-bold">Reject & Deduct Loss</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowRejectModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p>You are rejecting the data change request for <strong>{activeRequest.product_name}</strong>. The original stock number will remain unchanged.</p>
                  
                  <div className="alert alert-warning">
                    <strong>Calculated Financial Loss:</strong> {formatNumber(calculatedLoss)} RWF<br />
                    <small>({activeRequest.old_sold} old - {activeRequest.new_sold} new = {activeRequest.old_sold - activeRequest.new_sold} items * {activeRequest.price} RWF)</small>
                  </div>

                  <form onSubmit={confirmReject}>
                    <div className="alert alert-info py-2">
                      <strong>👤 Penalty will be applied to:</strong> {activeRequest.requester_username}
                    </div>

                    <div className="mb-3">
                      <label className="fw-bold">Rejection/Penalty Reason (Required)</label>
                      <textarea 
                        className="form-control" 
                        rows="2" 
                        required
                        placeholder="e.g. Rejecting because items were actually sold..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      ></textarea>
                    </div>
                    
                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-danger">Confirm Rejection & Deduction</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default AdminRequests;
