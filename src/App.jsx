import { useEffect } from "react";
import { useLocation } from "react-router-dom"; 
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import { getFcmToken } from "./firebase/getFcmToken";
import "./App.css";
import NotificationListener from "./components/NotificationListener";
import AIAssistant from "./components/AIAssistant";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();
  const location = useLocation(); // Current location get karein

  useEffect(() => {
    if (user && user.uid) {
      getFcmToken(user.uid);
    }
  }, [user]);

  // ✅ 1. Wo saare paths jahan Gem ka main Navbar NAHI dikhana hai (SSP/Premium pages)
  const hideNavbarPaths = [
    "/ssp-dashboard",
    "/agreement-details",
    "/contract-view",
    "/tenant-agreement",
    "/portal",
    "/tenant-form",
    "/tenant-upload",
    "/view-contract"
  ];

  // ✅ 2. Check karein ki kya current path inme se kisi se shuru hota hai
  const shouldHideNavbar = hideNavbarPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // 3. Check karein ki kya current path '/chat' se shuru hota hai
  const isChatPage = location.pathname.startsWith("/chat");

  return (
    <>
      <NotificationListener />
      
      {/* ✅ 4. Condition update: Agar shouldHideNavbar FALSE hai, tabhi Navbar dikhega */}
      {!shouldHideNavbar && <Navbar />}
      
      <AppRoutes />
      
      {/* 5. Condition update: User login ho AUR chat page na ho tabhi AI Assistant dikhega */}
      {user && !isChatPage && <AIAssistant />} 
    </>
  );
}

export default App;