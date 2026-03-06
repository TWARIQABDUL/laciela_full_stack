import React, { useEffect, useState } from "react";
import axios from "axios";

function Kitchen() {
  const today = new Date().toISOString().split("T")[0];

  const [foods, setFoods] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(false);

  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/kitchen`;

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
            <button className="btn btn-outline-dark btn-sm" onClick={() => changeDate(-1)}>◀</button>
            <strong>{selectedDate}</strong>
            <button className="btn btn-outline-dark btn-sm" onClick={() => changeDate(1)} disabled={selectedDate === today}>▶</button>
            <button className="btn btn-success ms-3" onClick={handleAdd}>+ Add Food</button>
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
                <th>Cost</th>
                <th>Selling</th>
                <th>Opening</th>
                <th>Stock In</th>
                <th>Total</th>
                <th>Sold</th>
                <th>Closing</th>
                <th>Sales</th>
                <th>Momo</th>
                <th>Cash</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="12">Loading...</td></tr>
              ) : foods.length === 0 ? (
                <tr><td colSpan="12">No food items for this date</td></tr>
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
                      <td>{formatNumber(cost)}</td>
                      <td>{formatNumber(price)}</td>
                      <td>{opening}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={entree}
                          onChange={(e) => handleEntreeChange(f.id, e.target.value)}
                        />
                      </td>
                      <td>{total}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={sold}
                          onChange={(e) => handleSoldChange(f.id, e.target.value)}
                        />
                      </td>
                      <td className={isLow ? "text-danger fw-bold" : ""}>{closing}</td>
                      <td className="text-success fw-bold">{formatNumber(totalSold)}</td>
                      <td>{formatNumber(f.momo)}</td>
                      <td>{formatNumber(f.cash)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Kitchen;