import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import AdminLogin from "../pages/public/AdminLogin.jsx";
import Dashboard from "../pages/admin/Dashboard.jsx";
import Workshops from "../pages/admin/Workshops.jsx";
import Services from "../pages/admin/Services.jsx";
import ServiceCategories from "../pages/admin/ServiceCategories.jsx";
import Users from "../pages/admin/Users.jsx";
import Bookings from "../pages/admin/Bookings.jsx";
import Jobs from "../pages/admin/Jobs.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AdminRoute from "../components/AdminRoute.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public */}
      <Route path="/" element={<AdminLogin />} />

      {/* Admin only */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Users />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workshops"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Workshops />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Services />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-categories"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <ServiceCategories />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Bookings />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Jobs />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
    </>,
  ),
);

export default router;