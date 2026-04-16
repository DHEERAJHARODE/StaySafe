import { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import "./Premium.css";

const Premium = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAlreadyPremium, setIsAlreadyPremium] = useState(false);
  const navigate = useNavigate();

  // ✅ PAGE LOAD HOTE HI CHECK KARO KI KYA USER PEHLE SE PREMIUM HAI?
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setIsAlreadyPremium(userSnap.data().isPremium || false);
          }
        } catch (error) {
          console.error("Error fetching premium status:", error);
        }
      }
      setChecking(false); // Check complete
    });

    return () => unsubscribe();
  }, []);

  const handleBuyPremium = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please login first!");

    // ✅ AGAR PEHLE SE PREMIUM HAI TOH SEEDHA SSP PAR BHEJO BINA PAYMENT KE
    if (isAlreadyPremium) {
      window.location.href = "http://localhost:5174/dashboard"; // Seedha dashboard bhejo
      return;
    }

    setLoading(true);

    // ✅ Razorpay Options Configuration with your Test API Key
    const options = {
      key: "rzp_test_SdbrxKIa6tGLEw", 
      amount: 9900, 
      currency: "INR",
      name: "StaySafe Pro",
      description: "Premium Membership (6 Months)",
      image: "https://cdn-icons-png.flaticon.com/512/5113/5113074.png", 
      handler: async function (response) {
        try {
          console.log("Payment Success! ID:", response.razorpay_payment_id);
          
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 6);

          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            isPremium: true,
            premiumExpiry: expiryDate
          });

          alert("🎉 Payment Successful! Redirecting to StaySafe Pro Portal...");
          window.location.href = "https://staysafe-pro.vercel.app"; 
          
        } catch (error) {
          console.error("Error upgrading to premium:", error);
          alert("Payment received, but error updating profile. Please contact support.");
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: user.displayName || "Premium User",
        email: user.email,
        contact: "", 
      },
      theme: {
        color: "#d4af37", 
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert("Payment Failed: " + response.error.description);
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Razorpay script not loaded", error);
      alert("Payment gateway loading failed. Make sure you added the script in index.html");
      setLoading(false);
    }
  };

  if (checking) {
    return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Loading...</div>;
  }

  return (
    <div className="premium-container">
      <div className="premium-bg-blob blob-1"></div>
      <div className="premium-bg-blob blob-2"></div>
      
      <div className="premium-content">
        <div className="premium-badge">Built for Trust & Safety</div>
        <h1 className="premium-title">Elevate Your <span>Experience.</span></h1>
        <p className="premium-subtitle">
          Join 5,000+ users who are already using our premium tools to simplify their rental journey.
        </p>
        
        <div className="premium-card">
          {/* Agar premium hai toh price mat dikhao */}
          {!isAlreadyPremium && (
            <div className="premium-price-tag">
              <span className="price-currency">₹</span>
              <span className="price-amount">99</span>
              <span className="price-duration">/ 6 Months</span>
            </div>
          )}

          <ul className="feature-list">
            <li className="feature-item">
              <span className="check-icon">✓</span>
              <span><b>Verified Trust Badge</b> on your profile</span>
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span>
              <span><b>Legal Agreement</b> Generator access</span>
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span>
              <span><b>Priority Listing</b> in search results</span>
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span>
              <span><b>Unlimited</b> document collection tools</span>
            </li>
          </ul>

          <button 
            className="premium-buy-btn"
            onClick={handleBuyPremium} 
            disabled={loading}
            style={isAlreadyPremium ? { background: "#4739eb", color: "#fff" } : {}}
          >
            {loading ? "Processing..." : isAlreadyPremium ? "Go to StaySafe Pro" : "Become a Premium Member"}
          </button>
          
          {!isAlreadyPremium && (
            <p className="premium-footer-text">
              One-time payment. No hidden charges.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Premium;