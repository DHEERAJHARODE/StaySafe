import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // 🛑 NOT LOGGED IN → DO NOTHING
      if (!currentUser) return;

      // 🚨 EMAIL NOT VERIFIED
      if (!currentUser.emailVerified) {
        // already on verify page? then don't loop
        if (location.pathname !== "/verify-email") {
          navigate("/verify-email", { replace: true });
        }
        return;
      }

      // ✅ EMAIL VERIFIED → ALLOW NORMAL FLOW
      if (
        currentUser.emailVerified &&
        (location.pathname === "/login" ||
          location.pathname === "/register" ||
          location.pathname === "/verify-email")
      ) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => unsub();
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
      value={{ user, logout, signInWithGoogle }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);