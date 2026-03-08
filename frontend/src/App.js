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
import AdminRequests from "./component/pages/AdminRequests";
import Reports from "./component/pages/Reports"; // Performance Reports
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
          {/* Home/Dashboard (Accessible to everyone with an active role) */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "BAR_MAN", "CHIEF_KITCHEN", "TOKEN_MAN", "LAND_LORD", "GYM"]} />}>
            <Route path="/" element={<><Navbar /><Home /></>} />
          </Route>

          {/* Bar Routes */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "BAR_MAN"]} />}>
            <Route path="/Bar" element={<><Navbar /><Bar /></>} />
          </Route>

          {/* Kitchen Routes */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "CHIEF_KITCHEN"]} />}>
            <Route path="/Kitchen" element={<><Navbar /><Kitchen /></>} />
          </Route>

          {/* Guesthouse Routes */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "LAND_LORD"]} />}>
            <Route path="/GuestHouse" element={<><Navbar /><GuestHouse /></>} />
          </Route>

          {/* Gym Routes */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "GYM"]} />}>
            <Route path="/GYM" element={<><Navbar /><GYM /></>} />
          </Route>

          {/* Billiard Routes */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "TOKEN_MAN"]} />}>
            <Route path="/Billiard" element={<><Navbar /><Billiard /></>} />
          </Route>

          {/* Management/Admin Routes (Expenses, Staff, Loans, Change Requests, Reports) */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER"]} />}>
            <Route path="/Expenses" element={<><Navbar /><Expenses /></>} />
            <Route path="/credits" element={<><Navbar /><Credits /></>} />
            <Route path="/employees/:id/loans" element={<><Navbar /><EmployeeLoans /></>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]} />}>
            <Route path="/reports" element={<><Navbar /><Reports /></>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
            <Route path="/requests" element={<><Navbar /><AdminRequests /></>} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;