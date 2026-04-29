import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Sparkles, FileText, CheckCircle, ShieldCheck } from 'lucide-react';
import './PremiumAdBanner.css'; 

const PremiumAdBanner = () => {
  const { user, isPremium, loading } = useAuth();
  const navigate = useNavigate();
  
  // Nayi states user ka role check karne ke liye
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.uid) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setRole(userSnap.data().role); // Database se role nikal liya
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setRoleLoading(false);
    };

    // Jab app ka main loading khatam ho jaye, tab role check karo
    if (!loading) {
      fetchUserRole();
    }
  }, [user, loading]);

  // ✅ MAIN LOGIC: Agar user login nahi hai, premium hai, ya fir OWNER nahi hai -> Toh ad mat dikhao!
  if (loading || roleLoading || !user || isPremium || role !== "owner") {
    return null; 
  }

  return (
    <div className="premium-ad-container">
      <div className="premium-ad-content">
        <div className="ad-badge">
          <Sparkles size={14} /> PRO FEATURE
        </div>
        <h2 className="ad-title">
          Upgrade to <span className="highlight">StaySafe Premium</span>
        </h2>
        <p className="ad-description">
          Manage your rental agreements and document verification seamlessly in one place. Say goodbye to paperwork!
        </p>
        
        <div className="ad-features">
          <div className="ad-feature">
            <FileText size={18} className="feature-icon" />
            <span>Digital Agreements</span>
          </div>
          <div className="ad-feature">
            <CheckCircle size={18} className="feature-icon" />
            <span>Instant Verification</span>
          </div>
          <div className="ad-feature">
            <ShieldCheck size={18} className="feature-icon" />
            <span>100% Secure Storage</span>
          </div>
        </div>

        <button 
          className="ad-upgrade-btn"
          onClick={() => navigate('/premium')}
        >
          Unlock Premium for ₹99
        </button>
      </div>
      <div className="ad-image-placeholder">
        <div className="abstract-shape"></div>
      </div>
    </div>
  );
};

export default PremiumAdBanner;