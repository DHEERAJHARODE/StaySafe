import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore"; // ✅ onSnapshot import kiya
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false); // ✅ Premium status track karne ke liye
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let unsubscribeSnapshot = null; // ✅ Live data listener ko control karne ke liye

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // 🛑 NOT LOGGED IN → STOP LISTENING & DO NOTHING
      if (!currentUser) {
        setIsPremium(false);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        return;
      }

      // 🚨 EMAIL NOT VERIFIED
      if (!currentUser.emailVerified) {
        if (location.pathname !== "/verify-email") {
          navigate("/verify-email", { replace: true });
        }
        setLoading(false);
        return;
      }

      // ✅ EMAIL VERIFIED → ATTACH REAL-TIME LISTENER FOR PREMIUM STATUS
      const userRef = doc(db, "users", currentUser.uid);
      unsubscribeSnapshot = onSnapshot(userRef, (userSnap) => {
        if (userSnap.exists()) {
          setIsPremium(userSnap.data().isPremium || false);
        } else {
          setIsPremium(false);
        }
        setLoading(false); // Data aane ke baad hi app ko aage badhne do
      });

      // ✅ LOGGED IN & VERIFIED USER ROUTING
      if (
        currentUser.emailVerified &&
        (location.pathname === "/login" ||
          location.pathname === "/register" ||
          location.pathname === "/verify-email")
      ) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => {
      unsub();
      if (unsubscribeSnapshot) unsubscribeSnapshot(); // Cleanup
    };
  }, [navigate, location.pathname]);

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // ✅ GOOGLE SIGN IN (Fixed for Premium Fields)
  const signInWithGoogle = async (navigate) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // 1. Agar User bilkul naya hai
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: "room-seeker", // Default role
          isPremium: false,    // Premium Status
          premiumExpiry: null, // Expiry Date
          createdAt: new Date(),
        });
        navigate("/choose-role");
      } else {
        // 2. Agar User pehle se hai
        const data = userDoc.data();
        if (data.isPremium === undefined || data.premiumExpiry === undefined) {
          await setDoc(userRef, {
            isPremium: data.isPremium ?? false,
            premiumExpiry: data.premiumExpiry ?? null
          }, { merge: true });
        }
        // Agar new user tha aur seedha dashboard aaya, role change karke
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <AuthContext.Provider
      // ✅ Yahan isPremium pass karna bahut zaroori hai
      value={{ user, loading, isPremium, logout, signInWithGoogle }} 
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);