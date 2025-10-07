// src/App.jsx
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import PrivateRoute from "./routes/PrivateRoute";
import AdminPrivateRoute from "./routes/AdminPrivateRoute";
import EmployeePrivateRoute from "./routes/EmployeePrivateRoute";
import useAuthCheck from "./hooks/useAuthCheck";
import AppThemeProvider from "./services/AppThemeProvider";
import DarkModeProvider from "./context/DarkModeProvider";
import CssBaseline from "@mui/material/CssBaseline";
import Loader from "./components/common/Loader";

// custom routes
import ClientRoutes from "./routes/ClientRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import EmployeeRoutes from "./routes/EmployeeRoutes";

// Lazy imports
const LoginPage = lazy(() => import("./features/auth/pages/LoginPage"));
const Register = lazy(() => import("./features/auth/pages/Register"));

function AppWrapper() {
  const loading = useAuthCheck();

  if (loading) {
    return <Loader size="large" global={true} />;
  }

  return (
    <Router>
      <Suspense fallback={<Loader size="large" global={true} />}>
        <Routes>
          {/* Public routes */}
          {ClientRoutes.map((route, idx) => (
            <Route key={idx} path={route.path} element={route.element} />
          ))}

          <Route
            path="/login"
            element={
              <Suspense fallback={<Loader size="medium" />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="/register"
            element={
              <Suspense fallback={<Loader size="medium" />}>
                <Register />
              </Suspense>
            }
          />

          {/* Admin routes */}
          <Route element={<AdminPrivateRoute />}>
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Route>

          {/* Protected routes */}
          <Route element={<EmployeePrivateRoute />}>
            <Route path="/employee/*" element={<EmployeeRoutes />} />
          </Route>

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/private/*" element={<AdminRoutes />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <DarkModeProvider>
      {/* <AppThemeProvider> */}
      <Provider store={store}>
        <AppWrapper />
      </Provider>
      {/* </AppThemeProvider> */}
    </DarkModeProvider>
  );
}

export default App;
