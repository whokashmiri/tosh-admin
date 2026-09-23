import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

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
          <div>
            Supervisor Dashboard
          </div>
        }
      />

      <Route
        path="/admin"
        element={
          <div>
            Admin Dashboard
          </div>
        }
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