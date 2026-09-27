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
import BookingDetail from "../pages/admin/BookingDetail.jsx";
import Jobs from "../pages/admin/Jobs.jsx";
import JobDetail from "../pages/admin/JobDetail.jsx";
import Inventory from "../pages/admin/Inventory.jsx";
import Invoices from "../pages/admin/Invoices.jsx";
import Payments from "../pages/admin/Payments.jsx";
import Reviews from "../pages/admin/Reviews.jsx";
import Inspections from "../pages/admin/Inspections.jsx";
import Notifications from "../pages/admin/Notifications.jsx";
import AuditLogs from "../pages/admin/AuditLogs.jsx";
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
        path="/bookings/:bookingId"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <BookingDetail />
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
      <Route
        path="/jobs/:jobId"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <JobDetail />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Inventory />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Invoices />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Payments />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Reviews />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inspections"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Inspections />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Notifications />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AuditLogs />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
    </>,
  ),
);

export default router;