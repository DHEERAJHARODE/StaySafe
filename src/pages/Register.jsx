import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("room-seeker");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // ✅ Send verification email
      await sendEmailVerification(res.user);

      // ✅ Save user (Added premium fields here)
      await setDoc(doc(db, "users", res.user.uid), {
        email,
        role,
        isPremium: false,        // <-- Naya field: Default premium false rahega
        premiumExpiry: null,     // <-- Naya field: Expiry date abhi null rahegi
        createdAt: new Date(),
      });

      // 🔥 VERY IMPORTANT: LOGOUT USER
      await signOut(auth);

      // ✅ Go to verify page
      navigate("/verify-email");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-card" onSubmit={handleRegister}>
        <h2>Create your account</h2>
        <p className="subtitle">
          Join trusted room owners & seekers
        </p>

        <button
          type="button"
          className="google-btn"
          onClick={() => signInWithGoogle(navigate)}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="google"
          />
          Continue with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <input
          type="email"
          placeholder="Email address"
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* ROLE */}
        <div className="role-section">
          <p className="role-title">I am here to</p>
          <div className="role-options">
            <div
              className={`role-card ${
                role === "room-seeker" ? "active" : ""
              }`}
              onClick={() => setRole("room-seeker")}
            >
              🧳
              <h4>Find a Room</h4>
              <span>Book safe & verified rooms</span>
            </div>

            <div
              className={`role-card ${
                role === "owner" ? "active" : ""
              }`}
              onClick={() => setRole("owner")}
            >
              🏠
              <h4>List My Room</h4>
              <span>Earn by renting your space</span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Get Started"}
        </button>
      </form>
    </div>
  );
};

export default Register;