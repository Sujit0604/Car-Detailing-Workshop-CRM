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
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import StaffRoute from "../components/StaffRoute.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
        {/* public route */}
        <Route path="/" element={<LandingPage />}/>

        {/* Private Route */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
        <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>}/>
        <Route path="/book-service" element={<ProtectedRoute><BookService /></ProtectedRoute>}/>
        <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>}/>
        
        <Route path="/workshop/jobs" element={<ProtectedRoute><StaffRoute><JobBoard /></StaffRoute></ProtectedRoute>}/>
        <Route path="/workshop/jobs/:jobId" element={<ProtectedRoute><StaffRoute><JobDetail /></StaffRoute></ProtectedRoute>}/>
        <Route path="/workshop/bookings" element={<ProtectedRoute><StaffRoute><WorkshopBookings /></StaffRoute></ProtectedRoute>}/>
    </>,
  ),
);

export default router;