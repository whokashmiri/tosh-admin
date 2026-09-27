import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DriversPage from "./pages/DriversPage";
import LiveLocationPage from "./pages/LiveLocationPage";
import OrdersPage from "./pages/OrdersPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      <Route
        path="/dashboard"
       
          element={
          <DashboardPage />
        }
        
      />

      <Route
        // path="/admin"
        path="/admin"
        element={
          <DashboardPage />
        }
      />
      <Route
  path="/dashboard/drivers"
  element={
    <DriversPage />
  }
/>

<Route
  path="/dashboard/live-location"
  element={
    <LiveLocationPage />
  }
/>

<Route
  path="/dashboard/orders"
  element={<OrdersPage />}
/>
      <Route
  path="/admin-alshahrani"
  element={
    <RegisterPage />
  }
/>
    </Routes>
  );
}