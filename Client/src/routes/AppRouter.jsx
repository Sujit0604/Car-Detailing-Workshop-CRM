import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import LandingPage from "../pages/public/LandingPage.jsx";
import Dashboard from "../pages/customer/Dashboard.jsx";
import Vehicles from "../pages/customer/Vehicles.jsx";
import BookService from "../pages/customer/BookService.jsx";
import Bookings from "../pages/customer/Bookings.jsx";
import JobBoard from "../pages/workshop/JobBoard.jsx";
import JobDetail from "../pages/workshop/JobDetail.jsx";
import WorkshopBookings from "../pages/workshop/WorkshopBookings.jsx";
import Inventory from "../pages/workshop/Inventory.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import StaffRoute from "../components/StaffRoute.jsx";
import RoleRoute from "../components/RoleRoute.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
        {/* public route */}
        <Route path="/" element={<LandingPage />}/>

        {/* Private Route */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleRoute roles={['CUSTOMER']}><Dashboard /></RoleRoute></ProtectedRoute>}/>
        <Route path="/vehicles" element={<ProtectedRoute><RoleRoute roles={['CUSTOMER']}><Vehicles /></RoleRoute></ProtectedRoute>}/>
        <Route path="/book-service" element={<ProtectedRoute><RoleRoute roles={['CUSTOMER']}><BookService /></RoleRoute></ProtectedRoute>}/>
        <Route path="/bookings" element={<ProtectedRoute><RoleRoute roles={['CUSTOMER']}><Bookings /></RoleRoute></ProtectedRoute>}/>
        <Route path="/jobs/:jobId" element={<ProtectedRoute><RoleRoute roles={['CUSTOMER']}><JobDetail /></RoleRoute></ProtectedRoute>}/>
        
        <Route path="/workshop/jobs" element={<ProtectedRoute><StaffRoute><JobBoard /></StaffRoute></ProtectedRoute>}/>
        <Route path="/workshop/jobs/:jobId" element={<ProtectedRoute><StaffRoute><JobDetail /></StaffRoute></ProtectedRoute>}/>
        <Route path="/workshop/bookings" element={<ProtectedRoute><RoleRoute roles={['WORKSHOP_MANAGER', 'SERVICE_ADVISOR', 'ADMIN']}><WorkshopBookings /></RoleRoute></ProtectedRoute>}/>
        <Route path="/workshop/inventory" element={<ProtectedRoute><RoleRoute roles={['WORKSHOP_MANAGER', 'ADMIN']}><Inventory /></RoleRoute></ProtectedRoute>}/>
    </>,
  ),
);

export default router;