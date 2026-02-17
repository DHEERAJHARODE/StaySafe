import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  getDocs, 
  writeBatch 
} from "firebase/firestore";
import { Link } from "react-router-dom";
import "./MyRequests.css";

const MyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Notification Auto-Read Logic
  useEffect(() => {
    const markAsRead = async () => {
      if (!user?.uid) return;
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("read", "==", false)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach((d) => batch.update(d.ref, { read: true }));
        await batch.commit();
      }
    };
    markAsRead();
  }, [user?.uid]);

  // 2. Fetch Requests Logic
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "bookings"), where("seekerId", "==", user.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const list = [];
      for (let d of snap.docs) {
        const data = d.data();
        const roomSnap = await getDoc(doc(db, "rooms", data.roomId));
        const roomData = roomSnap.data(); // Extract full room data
        
        list.push({
          id: d.id,
          ...data,
          roomTitle: roomData?.title || "Room",
          roomImage: roomData?.image || "",
          roomRent: roomData?.rent || "",
          // Fetch coordinates
          roomLat: roomData?.latitude,
          roomLng: roomData?.longitude,
          roomLocation: roomData?.location || ""
        });
      }
      setRequests(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  // Function to generate Google Maps URL
  const getMapUrl = (lat, lng, locationName) => {
    if (lat && lng) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`;
  };

  if (loading) return <p className="loading">Loading your requests...</p>;

  return (
    <div className="my-requests-page">
      <h2>My Booking Requests</h2>
      <div className="requests-list">
        {requests.length === 0 ? <p className="empty">No requests found.</p> : 
          requests.map((r) => (
            <div className="request-card" key={r.id}>
              {r.roomImage && <img src={r.roomImage} className="request-room-image" alt="room" />}
              <div className="request-info">
                <h4>{r.roomTitle}</h4>
                <p className="rent">₹{r.roomRent} / month</p>
                <span className={`status ${r.status}`}>{r.status}</span>
                {r.status === "accepted" && (
                  <div className="request-actions">
                    <Link to={`/chat/${r.roomId}`} className="chat-btn">💬 Chat Now</Link>
                    {/* Updated Visit Property Button to open Google Maps */}
                    <a 
                      href={getMapUrl(r.roomLat, r.roomLng, r.roomLocation)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="visit-btn"
                    >
                      📍 Visit Property
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default MyRequests;