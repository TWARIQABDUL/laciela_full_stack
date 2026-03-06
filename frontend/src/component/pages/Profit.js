import React, { useState } from "react";

function Profit() {
  const [profits, setProfits] = useState([
    {
      id: 1,
      source: "Bar Sales",
      amount: 50000,
      type: "Daily",
      date: "2026-01-25",
      status: "Pending",
    },
    {
      id: 2,
      source: "Gym Membership",
      amount: 30000,
      type: "Monthly",
      date: "2026-01-20",
      status: "Received",
    },
  ]);

  // ADD PROFIT
  const handleAdd = () => {
    const source = prompt("Profit source:");
    const amount = prompt("Amount:");
    const type = prompt("Type (Daily / Monthly / Other):");

    if (source && amount && type) {
      setProfits([
        ...profits,
        {
          id: Date.now(),
          source,
          amount: Number(amount),
          type,
          date: new Date().toISOString().split("T")[0],
          status: "Pending",
        },
      ]);
    }
  };

  // UPDATE PROFIT
  const handleUpdate = (id) => {
    const amount = prompt("New amount:");
    const type = prompt("Type (Daily / Monthly / Other):");

    if (amount && type) {
      setProfits(
        profits.map((p) =>
          p.id === id ? { ...p, amount: Number(amount), type } : p
        )
      );
    }
  };

  // MARK AS RECEIVED
  const handleReceived = (id) => {
    setProfits(
      profits.map((p) =>
        p.id === id ? { ...p, status: "Received" } : p
      )
    );
  };

  return (
    <div className="container mt-4">

      {/* Header + Search */}
      <div className="card shadow">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Profit</h2>

          <form className="d-flex">
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search profit"
            />
            <button className="btn btn-outline-success">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow mt-4">

        {/* Top-right Add button */}
        <div className="card-body d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Profit Records</h5>
          <button className="btn btn-success" onClick={handleAdd}>
            + Add Profit
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover text-center mb-0">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Source</th>
                <th>Amount (RWF)</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {profits.length === 0 ? (
                <tr>
                  <td colSpan="7">No profit records</td>
                </tr>
              ) : (
                profits.map((p, index) => (
                  <tr key={p.id}>
                    <td>{index + 1}</td>
                    <td>{p.source}</td>
                    <td>{p.amount}</td>
                    <td>{p.type}</td>
                    <td>{p.date}</td>
                    <td>
                      {p.status === "Received" ? (
                        <span className="badge bg-success">Received</span>
                      ) : (
                        <span className="badge bg-warning text-dark">
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => handleUpdate(p.id)}
                      >
                        Update
                      </button>
                      {p.status !== "Received" && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleReceived(p.id)}
                        >
                          Received
                        </button>
                      )}
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

export default Profit;
