import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import OwnerPremiumAd from "../components/OwnerPremiumAd"; // ✅ Naya Ad Import Kiya
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const [role, setRole] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setRole(data.role);
        setProfileImage(data.profileImage || "");
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  if (loading) return <p className="loading">Loading dashboard...</p>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        {/* PROFILE IMAGE */}
        <img
          className="dashboard-avatar"
          src={
            profileImage ||
            "https://www.w3schools.com/howto/img_avatar.png"
          }
          alt="User"
        />

        <h2>My Dashboard</h2>
        <p>
          Welcome, <span>{user.email}</span>
        </p>
      </div>

      {role === "owner" && <OwnerDashboard />}
      {role === "room-seeker" && <SeekerDashboard />}
    </div>
  );
};

/* ================= OWNER DASHBOARD ================= */

const OwnerDashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <h3 className="role-title">Owner Panel</h3>

      {/* ✅ VIP OWNER AD YAHAN LAGA DIYA */}
      {/* Ye sirf Non-Premium owners ko dikhega */}
      <OwnerPremiumAd />

      <div className="dashboard-grid">
        <Card
          title="🛡️ My Profile"
          desc="View & edit your profile"
          onClick={() => navigate("/profile")}
        />

        <Card
          title="➕ Add New Room"
          desc="List a new room for rent"
          onClick={() => navigate("/add-room")}
        />

        <Card
          title="🏠 My Rooms"
          desc="View & manage your rooms"
          onClick={() => navigate("/my-rooms")}
        />

        <Card
          title="🔔 Booking Requests"
          desc="Approve or reject requests"
          onClick={() => navigate("/booking-requests")}
        />
      </div>
    </>
  );
};

/* ================= SEEKER DASHBOARD ================= */

const SeekerDashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <h3 className="role-title">Room Seeker Panel</h3>

      <div className="dashboard-grid">
        <Card
          title="🛡️ My Profile"
          desc="Edit personal information"
          onClick={() => navigate("/profile")}
        />

        <Card
          title="🔍 Browse Rooms"
          desc="Find rooms that match your needs"
          onClick={() => navigate("/rooms")}
        />

        <Card
          title="📥 My Requests"
          desc="Track booking requests"
          onClick={() => navigate("/my-requests")}
        />
      </div>
    </>
  );
};

/* ================= CARD COMPONENT ================= */

const Card = ({ title, desc, onClick }) => (
  <div className="dashboard-card" onClick={onClick}>
    <h4>{title}</h4>
    <p>{desc}</p>
  </div>
);

export default Dashboard;