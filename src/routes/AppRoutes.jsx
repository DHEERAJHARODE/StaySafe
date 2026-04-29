import { Routes, Route } from "react-router-dom";

// --- GEM APP MAIN PAGES ---
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
import Profile from "../pages/Profile";
import MyRequests from "../pages/MyRequests";
import ForgotPassword from "../pages/ForgotPassword";
import VerifyEmail from "../pages/VerifyEmail";
import Chat from "../pages/Chat";
import Inbox from "../pages/Inbox";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import ContactUs from "../pages/ContactUs";
import Terms from "../pages/Terms";
import Premium from "../pages/Premium"; 

// --- ROUTE GUARDS ---
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import PremiumRoute from "../components/PremiumRoute";

// --- SSP (PREMIUM) PAGES ---
// Naam change kiya hai taaki purane Dashboard se mix na ho
import SSPDashboard from "../premium/Dashboard"; 
import AgreementDetails from "../premium/AgreementDetails";
import ContractView from "../premium/ContractView";
import TenantAgreement from "../premium/TenantAgreement";
import TenantForm from "../premium/TenantForm";
import TenantPortal from "../premium/TenantPortal";
import TenantUpload from "../premium/TenantUpload"; // ✅ Added Missing Import

const AppRoutes = () => {
  return (
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* ================= PROTECTED ROUTES (Logged in users only) ================= */}
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

      {/* PREMIUM ROUTE (Payment Page) */}
      <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />

      {/* ================= PREMIUM (SSP) ROUTES ================= */}
      {/* Ye pages sirf unhe dikhenge jinka isPremium: true hai */}
      <Route path="/ssp-dashboard" element={<PremiumRoute><SSPDashboard /></PremiumRoute>} />
      <Route path="/agreement-details/:id" element={<PremiumRoute><AgreementDetails /></PremiumRoute>} />
      <Route path="/contract-view/:id" element={<PremiumRoute><ContractView /></PremiumRoute>} />
      <Route path="/tenant-agreement/:id" element={<PremiumRoute><TenantAgreement /></PremiumRoute>} />

      {/* ================= TENANT FORMS (Public for Tenants) ================= */}
      {/* Tenants ko payment karne ki zarurat nahi hai, isliye ye ProtectedRoute ke bina hain */}
      <Route path="/portal" element={<TenantPortal />} />
      <Route path="/tenant-form/:id" element={<TenantForm />} />
      <Route path="/tenant-upload/:id" element={<TenantUpload />} /> {/* ✅ Added Missing Route */}
      <Route path="/view-contract" element={<ContractView />} /> {/* ✅ Added Route for Tenant to View Contract */}

      {/* ================= GENERAL & LEGAL ROUTES ================= */}
      <Route path="/rooms" element={<RoomsList />} />
      <Route path="/room/:id" element={<RoomDetails />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
    </Routes>
  );
};

export default AppRoutes;