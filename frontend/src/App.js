import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ===== Layout & Navigation =====
import Navbar from "./component/include/Navbar";
import Layout from "./component/layout/Layout";
import Sidebar from "./component/layout/Sidebar";

// ===== Pages =====
import Home from "./component/pages/Home";
import Bar from "./component/pages/Bar";
import Kitchen from "./component/pages/Kitchen";
import GuestHouse from "./component/pages/GuestHouse";
import GYM from "./component/pages/GYM";
import Billiard from "./component/pages/Billiard";
import Expenses from "./component/pages/Expenses";
import Credits from "./component/pages/Credits"; // Employees/Credits page
import EmployeeLoans from "./component/pages/EmployeeLoans"; // ✅ Employee Loans page

function App() {
  return (
    <Router>
      {/* ===== Navbar ===== */}
      <Navbar />

      {/* ===== Main Routes ===== */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Bar" element={<Bar />} />
        <Route path="/Kitchen" element={<Kitchen />} />
        <Route path="/GuestHouse" element={<GuestHouse />} />
        <Route path="/GYM" element={<GYM />} />
        <Route path="/Billiard" element={<Billiard />} />
        <Route path="/Expenses" element={<Expenses />} />
        <Route path="/credits" element={<Credits />} /> {/* Employees/Credits */}
        <Route path="/employees/:id/loans" element={<EmployeeLoans />} /> {/* Employee Loans */}
      </Routes>
    </Router>
  );
}

export default App;