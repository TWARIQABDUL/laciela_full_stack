import React, { useEffect, useState } from "react";
import axios from "axios";

function Guesthouse() {
  const today = new Date().toISOString().split("T")[0];

  const [rooms, setRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(false);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalRoomsSold, setTotalRoomsSold] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/guesthouse`;

  // ================= FETCH ROOMS =================
  const fetchRooms = async (date) => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, { params: { date } });
      const roomList = res.data.rooms || [];
      setRooms(roomList);
      recalcTotals(roomList);
    } catch (err) {
      console.error("Error fetching guesthouse data:", err);
      setRooms([]);
      setTotalIncome(0);
      setTotalRoomsSold(0);
      setTotalSales(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(selectedDate);
  }, [selectedDate]);

  // ================= RECALCULATE TOTALS =================
  const recalcTotals = (roomList) => {
    let incomeSum = 0;
    let soldSum = 0;

    roomList.forEach((r) => {
      const vip = Number(r.vip || 0);
      const normal = Number(r.normal || 0);

      const vipPrice = Number(r.vip_price || 0);
      const normalPrice = Number(r.normal_price || 0);

      incomeSum += (vip * vipPrice) + (normal * normalPrice);
      soldSum += vip + normal;
    });

    setTotalIncome(incomeSum);
    setTotalSales(incomeSum);
    setTotalRoomsSold(soldSum);
  };

  // ================= CHANGE DATE =================
  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    const formatted = newDate.toISOString().split("T")[0];
    if (formatted > today) return;
    setSelectedDate(formatted);
  };

  // ================= ADD ROOM =================
  const handleAdd = async () => {
    const date = prompt("Date (YYYY-MM-DD):") || selectedDate;
    const vip = Number(prompt("VIP Rooms:")) || 0;
    const normal = Number(prompt("Normal Rooms:")) || 0;

    const vip_price = Number(prompt("VIP Room Price:")) || 0;
    const normal_price = Number(prompt("Normal Room Price:")) || 0;

    try {
      await axios.post(API_URL, {
        date,
        vip,
        normal,
        vip_price,
        normal_price
      });
      fetchRooms(selectedDate);
    } catch (err) {
      console.error("Error adding room:", err);
    }
  };

  // ================= UPDATE ROOM =================
  const handleRoomChange = (id, field, value) => {
    const numValue = Number(value);

    const updatedRooms = rooms.map((r) =>
      r.id === id ? { ...r, [field]: numValue } : r
    );

    setRooms(updatedRooms);
    recalcTotals(updatedRooms);

    axios
      .put(`${API_URL}/${id}`, { [field]: numValue })
      .catch((err) => console.error(`Error updating ${field}:`, err));
  };

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString();

  return (
    <div className="container-fluid mt-4">

      {/* ===== SUMMARY CARDS ===== */}
      <div className="row g-4 mb-4">

        <div className="col-md-3">
          <div className="card text-white shadow border-0" style={{ backgroundColor: "#0B3D2E" }}>
            <div className="card-body text-center">
              <h6>Total Income</h6>
              <h4>RWF {formatNumber(totalIncome)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow border-0" style={{ backgroundColor: "#D4AF37", color: "#000" }}>
            <div className="card-body text-center">
              <h6>Total Sales</h6>
              <h4>RWF {formatNumber(totalSales)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white shadow border-0" style={{ backgroundColor: "#0E6251" }}>
            <div className="card-body text-center">
              <h6>Total Rooms Sold</h6>
              <h4>{formatNumber(totalRoomsSold)}</h4>
            </div>
          </div>
        </div>

      </div>

      {/* ===== HEADER ===== */}
      <div className="card shadow mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">Guesthouse</h4>

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

            <button className="btn btn-success ms-3" onClick={handleAdd}>
              + Add Room
            </button>
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
                <th>Date</th>
                <th>VIP</th>
                <th>Normal</th>
                <th>VIP Price</th>
                <th>Normal Price</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr><td colSpan="6">Loading...</td></tr>

              ) : rooms.length === 0 ? (
                <tr><td colSpan="6">Ntamakuru ahari y' izi tariki</td></tr>

              ) : (
                rooms.map((r, i) => (
                  <tr key={r.id}>

                    <td>{i + 1}</td>
                    <td>{r.date}</td>

                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={r.vip || 0}
                        onChange={(e) =>
                          handleRoomChange(r.id, "vip", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={r.normal || 0}
                        onChange={(e) =>
                          handleRoomChange(r.id, "normal", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={r.vip_price || 0}
                        onChange={(e) =>
                          handleRoomChange(r.id, "vip_price", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={r.normal_price || 0}
                        onChange={(e) =>
                          handleRoomChange(r.id, "normal_price", e.target.value)
                        }
                      />
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
}

export default Guesthouse;