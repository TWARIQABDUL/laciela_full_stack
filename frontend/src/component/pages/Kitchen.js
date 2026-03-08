import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

function Kitchen() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const today = new Date().toISOString().split("T")[0];

  const [foods, setFoods] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(false);

  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Modal State for Edit Requests
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestItem, setRequestItem] = useState(null);
  const [requestData, setRequestData] = useState({
    new_sold: "",
    reason: "",
  });

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/kitchen`;
  const REQUESTS_URL = `${process.env.REACT_APP_API_BASE_URL}/requests`;

  const fetchFoods = async (date) => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, { params: { date } });
      const foodList = res.data.foods || [];
      setFoods(foodList);

      let salesSum = 0;
      let profitSum = 0;
      let stockValueSum = 0;
      let lowStock = 0;

      foodList.forEach((f) => {
        const opening = Number(f.opening_stock || 0);
        const entree = Number(f.entree || 0);
        const sold = Number(f.sold || 0);
        const price = Number(f.price || 0);
        const cost = Number(f.initial_price || 0);
        const closing = opening + entree - sold;

        salesSum += sold * price;
        profitSum += sold * (price - cost);
        stockValueSum += closing * cost;

        if (closing < 5) lowStock += 1;
      });

      setTotalSales(salesSum);
      setTotalProfit(profitSum);
      setTotalStockValue(stockValueSum);
      setLowStockCount(lowStock);

    } catch (err) {
      console.error("Error fetching kitchen data:", err);
      setFoods([]);
      setTotalSales(0);
      setTotalProfit(0);
      setTotalStockValue(0);
      setLowStockCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods(selectedDate);
  }, [selectedDate]);

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    const formatted = newDate.toISOString().split("T")[0];
    if (formatted > today) return;
    setSelectedDate(formatted);
  };

  const handleAdd = async () => {
    const name = prompt("Food name:");
    if (!name) return alert("Name is required");

    const initial_price = Number(prompt("Cost (RWF):")) || 0;
    const price = Number(prompt("Selling price (RWF):")) || 0;
    const opening_stock = Number(prompt("Opening stock:")) || 0;
    const entree = Number(prompt("Stock in:")) || 0;
    const sold = Number(prompt("Sold quantity:")) || 0;
    const momo = Number(prompt("Momo amount:")) || 0;
    const cash = Number(prompt("Cash amount:")) || 0;

    try {
      await axios.post(API_URL, {
        name,
        initial_price,
        price,
        opening_stock,
        entree,
        sold,
        momo,
        cash,
        date: selectedDate,
      });
      fetchFoods(selectedDate);
    } catch (err) {
      console.error("Error adding food:", err);
    }
  };

  const handleEntreeChange = async (id, value) => {
    if (!isSuperAdmin) return;
    const entreeValue = Number(value);

    setFoods((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, entree: entreeValue } : f
      )
    );

    try {
      await axios.put(`${API_URL}/entree/${id}`, { entree: entreeValue, date: selectedDate });
      fetchFoods(selectedDate);
    } catch (err) {
      console.error("Error updating entree:", err);
    }
  };

  const handleSoldChange = async (id, value) => {
    if (!isSuperAdmin) return;
    const soldValue = Number(value);

    setFoods((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, sold: soldValue } : f
      )
    );

    try {
      await axios.put(`${API_URL}/sold/${id}`, { sold: soldValue, date: selectedDate });
      fetchFoods(selectedDate);
    } catch (err) {
      console.error("Error updating sold:", err);
    }
  };

  const openRequestModal = (product) => {
    setRequestItem(product);
    setRequestData({ new_sold: product.sold, reason: "" });
    setShowRequestModal(true);
  };

  const submitEditRequest = async (e) => {
    e.preventDefault();
    if (!requestData.new_sold || !requestData.reason) return;

    try {
      await axios.post(REQUESTS_URL, {
        module: "kitchen_products",
        record_id: requestItem.id,
        record_date: selectedDate,
        product_name: requestItem.name,
        old_sold: requestItem.sold,
        new_sold: requestData.new_sold,
        price: requestItem.price,
        reason: requestData.reason,
      });

      alert("Change Request submitted to Super Admin!");
      setShowRequestModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to submit request");
    }
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString();

  return (
    <div className="container-fluid mt-4">

      {/* ===== SUMMARY CARDS ===== */}
      <div className="row g-4 mb-4">

        <div className="col-md-3">
          <div className="card text-white shadow border-0" style={{ backgroundColor: "#0B3D2E" }}>
            <div className="card-body text-center">
              <h6>Total Sales</h6>
              <h4>RWF {formatNumber(totalSales)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow border-0" style={{ backgroundColor: "#D4AF37", color: "#000" }}>
            <div className="card-body text-center">
              <h6>Total Profit</h6>
              <h4>RWF {formatNumber(totalProfit)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white shadow border-0" style={{ backgroundColor: "#0E6251" }}>
            <div className="card-body text-center">
              <h6>Total Stock Value</h6>
              <h4>RWF {formatNumber(totalStockValue)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white shadow border-0" style={{ backgroundColor: "#C0392B" }}>
            <div className="card-body text-center">
              <h6>Low Stock Items</h6>
              <h4>{lowStockCount}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <div className="card shadow mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">Kitchen</h4>
          <div className="d-flex align-items-center gap-2">
             <div className="d-flex align-items-center gap-2">
              <button className="btn btn-outline-dark btn-sm" onClick={() => changeDate(-1)}>◀</button>
              <strong>{selectedDate}</strong>
              <button className="btn btn-outline-dark btn-sm" onClick={() => changeDate(1)} disabled={selectedDate === today}>▶</button>
            </div>
            
            {isSuperAdmin && (
              <button className="btn btn-success ms-3" onClick={handleAdd}>+ Add Food</button>
            )}
          </div>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="card shadow">
        <div className="table-responsive">
          <table className="table table-bordered table-hover text-center mb-0">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Food</th>
                {isSuperAdmin && <th>Cost</th>}
                <th>Selling</th>
                <th>Opening</th>
                <th>Stock In</th>
                <th>Total</th>
                <th>Sold</th>
                <th>Closing</th>
                <th>Sales</th>
                <th>Momo</th>
                <th>Cash</th>
                {!isSuperAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="13">Loading...</td></tr>
              ) : foods.length === 0 ? (
                <tr><td colSpan="13">No food items for this date</td></tr>
              ) : (
                foods.map((f, i) => {
                  const opening = Number(f.opening_stock || 0);
                  const entree = Number(f.entree || 0);
                  const sold = Number(f.sold || 0);
                  const price = Number(f.price || 0);
                  const cost = Number(f.initial_price || 0);

                  const total = opening + entree;
                  const totalSold = sold * price;
                  const closing = total - sold;
                  const isLow = closing < 5;

                  return (
                    <tr key={f.id}>
                      <td>{i + 1}</td>
                      <td>{f.name}{isLow && <span className="badge bg-danger ms-2">Low</span>}</td>
                      {isSuperAdmin && <td>{formatNumber(cost)}</td>}
                      <td>{formatNumber(price)}</td>
                      <td>{opening}</td>
                      <td>
                        {isSuperAdmin ? (
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={entree}
                            onChange={(e) => handleEntreeChange(f.id, e.target.value)}
                          />
                        ) : (
                          <span>{entree}</span>
                        )}
                      </td>
                      <td>{total}</td>
                      <td>
                        {isSuperAdmin ? (
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={sold}
                            onChange={(e) => handleSoldChange(f.id, e.target.value)}
                          />
                        ) : (
                          <span>{sold}</span>
                        )}
                      </td>
                      <td className={isLow ? "text-danger fw-bold" : ""}>{closing}</td>
                      <td className="text-success fw-bold">{formatNumber(totalSold)}</td>
                      <td>{formatNumber(f.momo)}</td>
                      <td>{formatNumber(f.cash)}</td>
                      {!isSuperAdmin && (
                        <td>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => openRequestModal(f)}
                          >
                            Request Change
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQUEST CHANGE MODAL */}
      {showRequestModal && requestItem && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-warning text-dark">
                  <h5 className="modal-title fw-bold">Request Data Change</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRequestModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted mb-4">
                    State the correct number of items sold and note the reason (e.g., miscounted). 
                    A Super Admin will review this request.
                  </p>
                  <form onSubmit={submitEditRequest}>
                    <div className="mb-3">
                      <label className="fw-bold">Product</label>
                      <input type="text" className="form-control" value={requestItem.name} readOnly disabled />
                    </div>
                    <div className="mb-3">
                      <label className="fw-bold">Currently Saved "Sold" Target</label>
                      <input type="text" className="form-control" value={requestItem.sold} readOnly disabled />
                    </div>
                    <div className="mb-3">
                      <label className="fw-bold text-danger">New Correct "Sold" Target</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        required 
                        value={requestData.new_sold} 
                        onChange={(e) => setRequestData({...requestData, new_sold: e.target.value})} 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="fw-bold">Reason for Change (Required)</label>
                      <textarea 
                        className="form-control" 
                        rows="3" 
                        placeholder="I accidentally counted 12 but it was actually 10..."
                        required
                        value={requestData.reason}
                        onChange={(e) => setRequestData({...requestData, reason: e.target.value})}
                      ></textarea>
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-danger text-light">Submit Request</button>
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

export default Kitchen;