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
        list.push({
          id: d.id,
          ...data,
          roomTitle: roomSnap.data()?.title || "Room",
          roomImage: roomSnap.data()?.image || "",
          roomRent: roomSnap.data()?.rent || "",
        });
      }
      setRequests(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

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
                    <Link to={`/visit/${r.roomId}`} className="visit-btn">📍 Visit Property</Link>
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