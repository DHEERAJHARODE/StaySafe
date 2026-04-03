import { useEffect } from "react";
import { useLocation } from "react-router-dom"; // 1. useLocation import karein
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import { getFcmToken } from "./firebase/getFcmToken";
import "./App.css";
import NotificationListener from "./components/NotificationListener";
import AIAssistant from "./components/AIAssistant";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();
  const location = useLocation(); // 2. Current location get karein

  useEffect(() => {
    if (user && user.uid) {
      getFcmToken(user.uid);
    }
  }, [user]);

  // 3. Check karein ki kya current path '/chat' se shuru hota hai
  const isChatPage = location.pathname.startsWith("/chat");

  return (
    <>
      <NotificationListener />
      <Navbar />
      <AppRoutes />
      
      {/* 4. Condition update karein: User login ho AUR chat page na ho tabhi dikhega */}
      {user && !isChatPage && <AIAssistant />} 
    </>
  );
}

export default App;