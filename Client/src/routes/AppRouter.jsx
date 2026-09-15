import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import LandingPage from "../pages/public/LandingPage.jsx";
import Dashboard from "../pages/customer/Dashboard.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";


const router = createBrowserRouter(
  createRoutesFromElements(
    <>
        {/* public route */}
        <Route path="/" element={<LandingPage />}/>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>


    </>,
  ),
);

export default router;