import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

function Bar() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const today = new Date().toISOString().split("T")[0];

  const [products, setProducts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);

  const [totalEarned, setTotalEarned] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);

  // Modal State for Edit Requests
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestItem, setRequestItem] = useState(null);
  const [requestData, setRequestData] = useState({
    new_sold: "",
    reason: "",
  });

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/drinks`;
  const REQUESTS_URL = `${process.env.REACT_APP_API_BASE_URL}/requests`;

  const fetchProducts = async (date) => {
    try {
      setLoading(true);

      const res = await axios.get(API_URL, { params: { date } });

      const prods = res.data.products || [];

      setProducts(prods);
      setTotalEarned(res.data.totalEarned || 0);

      const profitSum = prods.reduce((sum, p) => sum + Number(p.profit || 0), 0);

      const stockValue = prods.reduce(
        (sum, p) =>
          sum + Number(p.closing_stock || 0) * Number(p.initial_price || 0),
        0
      );

      const lowStock = prods.filter((p) => Number(p.closing_stock) < 5);

      setTotalProfit(profitSum);
      setTotalStockValue(stockValue);
      setLowStockProducts(lowStock);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(selectedDate);
  }, [selectedDate]);

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    const formatted = newDate.toISOString().split("T")[0];

    if (formatted > today) return;

    setSelectedDate(formatted);
  };

  const handleAdd = async () => {
    const name = prompt("Product name:");
    if (!name) return;

    const initial_price = Number(prompt("Cost price:")) || 0;
    const price = Number(prompt("Selling price:")) || 0;
    const opening_stock = Number(prompt("Opening stock:")) || 0;

    await axios.post(API_URL, {
      name,
      initial_price,
      price,
      opening_stock,
      date: selectedDate,
    });

    fetchProducts(selectedDate);
  };

  const handleEdit = async (product) => {
    if (!isSuperAdmin) {
      // Open Change Request Modal for Non-Admins 
      setRequestItem(product);
      setRequestData({ new_sold: product.sold, reason: "" });
      setShowRequestModal(true);
      return;
    }

    // Standard Super Admin Edit Logic
    const newName = prompt("Edit product name:", product.name);
    if (!newName) return;

    const newCost = Number(prompt("Edit cost price:", product.initial_price));
    const newSelling = Number(prompt("Edit selling price:", product.price));
    const newOpening = Number(prompt("Edit opening stock:", product.opening_stock));

    await axios.put(`${API_URL}/edit/${product.id}`, {
      name: newName,
      initial_price: newCost || 0,
      price: newSelling || 0,
      opening_stock: newOpening || 0,
      date: selectedDate,
    });

    fetchProducts(selectedDate);
  };

  const submitEditRequest = async (e) => {
    e.preventDefault();
    if (!requestData.new_sold || !requestData.reason) return;

    try {
      await axios.post(REQUESTS_URL, {
        module: "bar_products",
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

  const handleLocalChange = (id, field, value) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const saveStock = async (product) => {
    if (!isSuperAdmin) return; // Non-admins can't save directly!

    await axios.put(`${API_URL}/stock/${product.id}`, {
      entree: Number(product.entree) || 0,
      sold: Number(product.sold) || 0,
      date: selectedDate,
    });

    fetchProducts(selectedDate);
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString();

  return (
    <div className="container mt-4">

      {/* DASHBOARD */}
      <div className="row g-4 mb-4">

        <div className="col-md-3">
          <div className="card shadow border-0 rounded-3" style={{background:"#0B3D2E",color:"#fff"}}>
            <div className="card-body text-center">
              <h6>Total Sales</h6>
              <h4>RWF {formatNumber(totalEarned)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow border-0 rounded-3" style={{background:"#D4AF37"}}>
            <div className="card-body text-center">
              <h6>Total Profit</h6>
              <h4>RWF {formatNumber(totalProfit)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow border-0 rounded-3" style={{background:"#0E6251",color:"#fff"}}>
            <div className="card-body text-center">
              <h6>Total Stock Value</h6>
              <h4>RWF {formatNumber(totalStockValue)}</h4>
            </div>
          </div>
        </div>

        {/* LOW STOCK LINK */}
        <div className="col-md-3">
          <div
            className="card shadow border-0 rounded-3"
            style={{background:"#C0392B",color:"#fff",cursor:"pointer"}}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <div className="card-body text-center">
              <h6>Low Stock</h6>
              <h4>{lowStockProducts.length}</h4>
            </div>
          </div>
        </div>

      </div>


      {/* HEADER */}
      <div className="card shadow-lg mb-4 border-0">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h4 className="fw-bold">Bar</h4>

          <div className="d-flex align-items-center gap-2">

            <button className="btn btn-outline-dark btn-sm" onClick={() => changeDate(-1)}>◀</button>

            <strong>{selectedDate}</strong>

            <button
              className="btn btn-outline-dark btn-sm"
              onClick={() => changeDate(1)}
              disabled={selectedDate === today}
            >
              ▶
            </button>

            {isSuperAdmin && (
              <button className="btn btn-success ms-3" onClick={handleAdd}>
                + Add Product
              </button>
            )}

          </div>
        </div>
      </div>



      {/* LOW STOCK TABLE */}
      {showLowStock && (
        <div className="card shadow-lg border-0 mb-4">
          <div className="card-body">

            <h5 className="fw-bold mb-3">Low Stock Products</h5>

            <table className="table table-hover text-center">

              <thead style={{background:"#1C1C1C",color:"#fff"}}>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Remaining</th>
                </tr>
              </thead>

              <tbody>
                {lowStockProducts.map((p,i)=>(
                  <tr key={p.id} style={{background:"#ffe6e6"}}>
                    <td>{i+1}</td>
                    <td>{p.name}</td>
                    <td>{p.closing_stock}</td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        </div>
      )}



      {/* MAIN BAR TABLE */}
      <div className="card shadow-lg border-0 rounded-4">

        <div className="table-responsive">

          <table
            className="table table-hover text-center mb-0"
            style={{borderCollapse:"separate",borderSpacing:"0 8px"}}
          >

            <thead style={{background:"#1C1C1C",color:"#fff"}}>

              <tr>
                <th>#</th>
                <th>Product</th>
                {isSuperAdmin && <th>Cost</th>}
                <th>Selling</th>
                <th>Opening</th>
                <th>Stock In</th>
                <th>Total</th>
                <th>Sold</th>
                <th>Closing</th>
                <th>Sales</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="11">Loading...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="11">No data</td>
                </tr>
              ) : (
                products.map((p,i)=>{

                  const isLow = Number(p.closing_stock) < 5;

                  return(
                    <tr
                      key={p.id}
                      className="shadow-sm"
                      style={{
                        background:isLow ? "#ffcccc" : "#F9F9F9",
                        borderRadius:"10px"
                      }}
                    >

                      <td>{i+1}</td>

                      <td className="fw-bold">{p.name}</td>

                      {isSuperAdmin && <td>RWF {formatNumber(p.initial_price)}</td>}

                      <td>RWF {formatNumber(p.price)}</td>

                      <td>{p.opening_stock}</td>

                      <td>
                        {isSuperAdmin ? (
                          <input
                            type="number"
                            className="form-control form-control-sm text-center"
                            value={p.entree || ""}
                            onChange={(e)=>handleLocalChange(p.id,"entree",e.target.value)}
                            onBlur={()=>saveStock(p)}
                          />
                        ) : (
                          <span>{p.entree}</span>
                        )}
                      </td>

                      <td>{p.total_stock}</td>

                      <td>
                        {isSuperAdmin ? (
                          <input
                            type="number"
                            className="form-control form-control-sm text-center"
                            value={p.sold || ""}
                            onChange={(e)=>handleLocalChange(p.id,"sold",e.target.value)}
                            onBlur={()=>saveStock(p)}
                          />
                        ) : (
                          <span>{p.sold}</span>
                        )}
                      </td>

                      <td className="fw-bold">{p.closing_stock}</td>

                      <td className="text-success fw-bold">
                        RWF {formatNumber(p.total_sold)}
                      </td>

                      <td>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={()=>handleEdit(p)}
                        >
                          {isSuperAdmin ? "Edit" : "Request Change"}
                        </button>
                      </td>

                    </tr>
                  )

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
                    Direct edits are locked for standard staff. State the correct number of items sold and note the reason (e.g., miscounted). 
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

export default Bar;