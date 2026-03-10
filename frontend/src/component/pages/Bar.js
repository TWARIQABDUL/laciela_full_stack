import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { FaPlus, FaTrash, FaEdit, FaChevronLeft, FaChevronRight, FaExclamationTriangle } from "react-icons/fa";
import "../../style/premium-pages.css";

function Bar() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const today = new Date().toISOString().split("T")[0];
  const [products, setProducts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [totals, setTotals] = useState({ earned: 0, profit: 0, stockValue: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "", initial_price: "", price: "", opening_stock: "", entree: "0", sold: "0"
  });

  const [requestData, setRequestData] = useState({ new_sold: "", reason: "" });
  const [requestItem, setRequestItem] = useState(null);

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/drinks`;
  const REQUESTS_URL = `${process.env.REACT_APP_API_BASE_URL}/requests`;

  const fetchProducts = React.useCallback(async (date) => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, { params: { date }, withCredentials: true });
      const prods = res.data.products || [];
      
      const profitSum = prods.reduce((sum, p) => sum + Number(p.profit || 0), 0);
      const stockValue = prods.reduce((sum, p) => sum + (Number(p.closing_stock || 0) * Number(p.initial_price || 0)), 0);
      const lowStock = prods.filter(p => Number(p.closing_stock) < 5);

      setProducts(prods);
      setTotals({
        earned: res.data.totalEarned || 0,
        profit: profitSum,
        stockValue: stockValue,
        lowStockCount: lowStock.length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (isAuthenticated) fetchProducts(selectedDate);
  }, [selectedDate, isAuthenticated, fetchProducts]);

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    const formatted = newDate.toISOString().split("T")[0];
    if (formatted <= today) setSelectedDate(formatted);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ name: "", initial_price: "", price: "", opening_stock: "", entree: "0", sold: "0" });
    setShowAddModal(true);
  };

  const handleOpenEdit = (product) => {
    if (!isSuperAdmin) {
      setRequestItem(product);
      setRequestData({ new_sold: product.sold, reason: "" });
      setShowRequestModal(true);
      return;
    }
    setEditingProduct(product);
    setFormData({
      name: product.name,
      initial_price: product.initial_price,
      price: product.price,
      opening_stock: product.opening_stock,
      entree: product.entree,
      sold: product.sold
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/edit/${editingProduct.id}`, { ...formData, date: selectedDate }, { withCredentials: true });
      } else {
        await axios.post(API_URL, { ...formData, date: selectedDate }, { withCredentials: true });
      }
      setShowAddModal(false);
      fetchProducts(selectedDate);
    } catch (err) {
      alert("Error saving product");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
      fetchProducts(selectedDate);
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const submitEditRequest = async (e) => {
    e.preventDefault();
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
      }, { withCredentials: true });
      alert("Request submitted!");
      setShowRequestModal(false);
    } catch (err) {
      alert("Failed to submit request");
    }
  };

  const updateInstantStock = async (product, field, value) => {
    if (!isSuperAdmin) return;
    const updatedValue = Number(value) || 0;
    try {
      await axios.put(`${API_URL}/stock/${product.id}`, {
        ...product,
        [field]: updatedValue,
        date: selectedDate
      }, { withCredentials: true });
      fetchProducts(selectedDate);
    } catch (err) {
      console.error(err);
    }
  };

  const formatRWF = (val) => Number(val).toLocaleString() + " RWF";

  return (
    <div className="premium-container">
      
      {/* STATS OVERVIEW */}
      <div className="stats-row">
        <div className="stats-card-premium card-sales">
          <h6>Total Sales</h6>
          <h4>{formatRWF(totals.earned)}</h4>
        </div>
        <div className="stats-card-premium card-profit">
          <h6>Net Profit</h6>
          <h4>{formatRWF(totals.profit)}</h4>
        </div>
        <div className="stats-card-premium card-stock">
          <h6>Stock Value</h6>
          <h4>{formatRWF(totals.stockValue)}</h4>
        </div>
        <div className="stats-card-premium card-low" onClick={() => setShowLowStock(!showLowStock)} style={{cursor:'pointer'}}>
          <h6>Low Stock</h6>
          <h4>{totals.lowStockCount} Items</h4>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="controls-card">
        <h2 className="page-title">Bar Inventory</h2>
        <div className="d-flex align-items-center gap-3">
          <div className="date-controls">
            <button className="btn-date" onClick={() => changeDate(-1)}><FaChevronLeft/></button>
            <span className="fw-bold px-2">{selectedDate}</span>
            <button className="btn-date" onClick={() => changeDate(1)} disabled={selectedDate === today}><FaChevronRight/></button>
          </div>
          {isSuperAdmin && (
            <button className="btn-premium btn-add" onClick={handleOpenAdd}>
              <FaPlus className="me-2"/> Add Product
            </button>
          )}
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="premium-table-card">
        <div className="table-responsive">
          <table className="table premium-table text-center mb-0">
            <thead>
              <tr>
                <th>Product</th>
                {isSuperAdmin && <th>Cost</th>}
                <th>Selling</th>
                <th>Opening</th>
                <th>In</th>
                <th>Total</th>
                <th>Sold</th>
                <th>Closing</th>
                <th>Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" className="py-5">Loading premium data...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="11" className="py-5 text-muted">No products found for this date</td></tr>
              ) : (
                products.map((p) => {
                  const isLow = p.closing_stock < 5;
                  return (
                    <tr key={p.id}>
                      <td className="fw-bold">
                        {p.name} {isLow && <FaExclamationTriangle className="text-danger ms-1" title="Low Stock"/>}
                      </td>
                      {isSuperAdmin && <td>{formatRWF(p.initial_price)}</td>}
                      <td className="fw-semibold text-primary">{formatRWF(p.price)}</td>
                      <td>{p.opening_stock}</td>
                      <td style={{width:'100px'}}>
                        {isSuperAdmin ? (
                          <input type="number" className="form-control form-control-sm premium-input text-center" 
                            defaultValue={p.entree} onBlur={(e) => updateInstantStock(p, 'entree', e.target.value)} />
                        ) : p.entree}
                      </td>
                      <td className="fw-bold">{p.total_stock}</td>
                      <td style={{width:'100px'}}>
                        {isSuperAdmin ? (
                          <input type="number" className="form-control form-control-sm premium-input text-center" 
                            defaultValue={p.sold} onBlur={(e) => updateInstantStock(p, 'sold', e.target.value)} />
                        ) : p.sold}
                      </td>
                      <td className={`fw-bold ${isLow ? 'text-danger' : ''}`}>{p.closing_stock}</td>
                      <td className="text-success fw-bold">{formatRWF(p.total_sold)}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button className="btn-premium btn-edit btn-sm" onClick={() => handleOpenEdit(p)}>
                            <FaEdit/>
                          </button>
                          {isSuperAdmin && (
                            <button className="btn-premium btn-delete btn-sm" onClick={() => handleDelete(p.id)}>
                              <FaTrash/>
                            </button>
                          )}
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

      {/* ADD/EDIT MODAL */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{background:'rgba(0,0,0,0.6)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0" style={{borderRadius:'20px'}}>
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="fw-bold">{editingProduct ? "Edit Product" : "New Bar Product"}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Name</label>
                    <input type="text" className="form-control premium-input" required 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold">Cost (RWF)</label>
                      <input type="number" className="form-control premium-input" required 
                        value={formData.initial_price} onChange={e => setFormData({...formData, initial_price: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Selling (RWF)</label>
                      <input type="number" className="form-control premium-input" required 
                        value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-4">
                      <label className="form-label fw-bold">Opening</label>
                      <input type="number" className="form-control premium-input" required 
                        value={formData.opening_stock} onChange={e => setFormData({...formData, opening_stock: e.target.value})} />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-bold">Stock In</label>
                      <input type="number" className="form-control premium-input" 
                        value={formData.entree} onChange={e => setFormData({...formData, entree: e.target.value})} />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-bold">Sold</label>
                      <input type="number" className="form-control premium-input" 
                        value={formData.sold} onChange={e => setFormData({...formData, sold: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="submit" className="btn-premium btn-add w-100 py-3 mt-2">
                    {editingProduct ? "Save Changes" : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST MODAL */}
      {showRequestModal && (
        <div className="modal fade show d-block" style={{background:'rgba(0,0,0,0.6)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0" style={{borderRadius:'20px'}}>
              <form onSubmit={submitEditRequest}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="fw-bold">Request Change</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRequestModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Product</label>
                    <input type="text" className="form-control" value={requestItem?.name} disabled />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-danger">Correct Sold Quantity</label>
                    <input type="number" className="form-control premium-input" required
                      value={requestData.new_sold} onChange={e => setRequestData({...requestData, new_sold: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Reason</label>
                    <textarea className="form-control premium-input" rows="3" required
                      value={requestData.reason} onChange={e => setRequestData({...requestData, reason: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="submit" className="btn-premium btn-add w-100 py-3 mt-2">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Bar;