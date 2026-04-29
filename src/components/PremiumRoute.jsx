import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PremiumRoute = ({ children }) => {
  const { user, isPremium, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "50px" }}>Checking Access... 🔒</div>;
  }

  // Agar user login nahi hai, toh login page par bhejo
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Agar user login hai par PREMIUM NAHI HAI, toh payment page par bhejo
  if (!isPremium) {
    return <Navigate to="/premium" />;
  }

  // Agar premium hai, toh page dikhao
  return children;
};

export default PremiumRoute;