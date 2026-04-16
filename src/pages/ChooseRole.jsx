import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "./ChooseRole.css";

const ChooseRole = () => {
  const [role, setRole] = useState("room-seeker");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = auth.currentUser;

  const handleNext = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // ✅ Yahan merge: true laga diya gaya hai taaki purana data (isPremium) delete na ho
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role,
        createdAt: serverTimestamp(),
      }, { merge: true });

      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="choose-role-container">
      <div className="choose-role-card">
        <h2>Tell us why you’re here</h2>
        <p className="subtitle">Choose how you want to use the app</p>

        <div className="role-options">
          <div
            className={`role-card ${role === "room-seeker" ? "active" : ""}`}
            onClick={() => setRole("room-seeker")}
          >
            <span className="emoji">🧳</span>
            <h4>Find a Room</h4>
            <p>Search & book verified rooms</p>
          </div>

          <div
            className={`role-card ${role === "owner" ? "active" : ""}`}
            onClick={() => setRole("owner")}
          >
            <span className="emoji">🏠</span>
            <h4>List My Room</h4>
            <p>Post rooms & manage bookings</p>
          </div>
        </div>

        <button onClick={handleNext} disabled={loading}>
          {loading ? "Saving..." : "Next"}
        </button>
      </div>
    </div>
  );
};

export default ChooseRole;