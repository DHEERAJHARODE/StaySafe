import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import { getFcmToken } from "./firebase/getFcmToken";
import "./App.css";
import NotificationListener from "./components/NotificationListener";
import AIAssistant from "./components/AIAssistant";
import { useAuth } from "./context/AuthContext"; // 1. AuthContext import kiya

function App() {
  const { user } = useAuth(); // 2. Logged-in user ka data get kiya

  useEffect(() => {
    // 3. Agar user login hai, tabhi uska FCM token get karo
    if (user && user.uid) {
      getFcmToken(user.uid);
    }
  }, [user]); // user state change hone par ye effect run hoga

  return (
    <>
      <NotificationListener />
      <Navbar />
      <AppRoutes />
      
      {/* 4. Floating AI Assistant sirf tabhi dikhega jab 'user' exist karta ho (logged in ho) */}
      {user && <AIAssistant />}
    </>
  );
}

export default App;