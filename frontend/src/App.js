import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ===== Layout & Navigation =====
import Layout from "./component/layout/Layout";

// ===== Pages =====
import Home from "./component/pages/Home";
import Bar from "./component/pages/Bar";
import Kitchen from "./component/pages/Kitchen";
import GuestHouse from "./component/pages/GuestHouse";
import GYM from "./component/pages/GYM";
import Billiard from "./component/pages/Billiard";
import Expenses from "./component/pages/Expenses";
import Credits from "./component/pages/Credits";
import EmployeeLoans from "./component/pages/EmployeeLoans";
import AdminRequests from "./component/pages/AdminRequests";
import Reports from "./component/pages/Reports";
import Login from "./component/pages/Login";
import ProtectedRoute from "./component/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* All protected routes are wrapped in the responsive Layout */}
          <Route element={<Layout />}>
            
            {/* Home/Dashboard */}
            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "BAR_MAN", "CHIEF_KITCHEN", "TOKEN_MAN", "LAND_LORD", "GYM"]} />}>
              <Route path="/" element={<Home />} />
            </Route>

            {/* Bar Routes */}
            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "BAR_MAN"]} />}>
              <Route path="/bar" element={<Bar />} />
            </Route>

            {/* Kitchen Routes */}
            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "CHIEF_KITCHEN"]} />}>
              <Route path="/kitchen" element={<Kitchen />} />
            </Route>

            {/* Guesthouse Routes */}
            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "LAND_LORD"]} />}>
              <Route path="/guesthouse" element={<GuestHouse />} />
            </Route>

            {/* Gym Routes */}
            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "GYM"]} />}>
              <Route path="/gym" element={<GYM />} />
            </Route>

            {/* Billiard Routes */}
            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "TOKEN_MAN"]} />}>
              <Route path="/billiard" element={<Billiard />} />
            </Route>

            {/* Management/Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER"]} />}>
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/employees/:id/loans" element={<EmployeeLoans />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]} />}>
              <Route path="/reports" element={<Reports />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
              <Route path="/requests" element={<AdminRequests />} />
            </Route>

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;