import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import AddRoom from "../pages/AddRoom";
import MyRooms from "../pages/MyRooms";
import EditRoom from "../pages/EditRoom";
import RoomsList from "../pages/RoomsList";
import RoomDetails from "../pages/RoomDetails";
import BookingRequests from "../pages/BookingRequests";
import ChooseRole from "../pages/ChooseRole";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Profile from "../pages/Profile";
import MyRequests from "../pages/MyRequests";
import ForgotPassword from "../pages/ForgotPassword";
import VerifyEmail from "../pages/VerifyEmail";
import Chat from "../pages/Chat";
import Inbox from "../pages/Inbox";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import ContactUs from "../pages/ContactUs";
import Terms from "../pages/Terms";
import Premium from "../pages/Premium"; // ✅ Naya Premium page import kiya hai

const AppRoutes = () => {
  return (
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* ================= PROTECTED ROUTES ================= */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/add-room" element={<ProtectedRoute><AddRoom /></ProtectedRoute>} />
      <Route path="/my-rooms" element={<ProtectedRoute><MyRooms /></ProtectedRoute>} />
      <Route path="/edit-room/:id" element={<ProtectedRoute><EditRoom /></ProtectedRoute>} />
      <Route path="/booking-requests" element={<ProtectedRoute><BookingRequests /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
      
      {/* MESSAGING SYSTEM */}
      <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
      <Route path="/chat/:roomId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

      {/* ✅ PREMIUM ROUTE (Naya route add kiya) */}
      <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />

      {/* ================= GENERAL & LEGAL ROUTES ================= */}
      <Route path="/rooms" element={<RoomsList />} />
      <Route path="/room/:id" element={<RoomDetails />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      
      {/* Added/Updated Legal & Support Pages */}
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
    </Routes>
  );
};

export default AppRoutes;