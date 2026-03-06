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
import Login from "./component/pages/Login";
import ProtectedRoute from "./component/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* ===== Main Routes ===== */}
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<><Navbar /><Home /></>} />
            <Route path="/Bar" element={<><Navbar /><Bar /></>} />
            <Route path="/Kitchen" element={<><Navbar /><Kitchen /></>} />
            <Route path="/GuestHouse" element={<><Navbar /><GuestHouse /></>} />
            <Route path="/GYM" element={<><Navbar /><GYM /></>} />
            <Route path="/Billiard" element={<><Navbar /><Billiard /></>} />
            <Route path="/Expenses" element={<><Navbar /><Expenses /></>} />
            <Route path="/credits" element={<><Navbar /><Credits /></>} /> {/* Employees/Credits */}
            <Route path="/employees/:id/loans" element={<><Navbar /><EmployeeLoans /></>} /> {/* Employee Loans */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;