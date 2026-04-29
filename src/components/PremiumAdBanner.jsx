import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Sparkles, FileText, CheckCircle, ShieldCheck, X } from 'lucide-react'; // ✅ X icon add kiya
import './PremiumAdBanner.css'; 

const PremiumAdBanner = () => {
  const { user, isPremium, loading } = useAuth();
  const navigate = useNavigate();
  
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true); // ✅ Ad show/hide karne ki state

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.uid) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setRole(userSnap.data().role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setRoleLoading(false);
    };

    if (!loading) {
      fetchUserRole();
    }
  }, [user, loading]);

  // ✅ MAIN LOGIC: Agar close pe click kiya hai (!isVisible), toh ad hide kar do
  if (!isVisible || loading || roleLoading || !user || isPremium || role !== "owner") {
    return null; 
  }

  return (
    <div className="premium-ad-container">
      {/* ✅ Top Right Close Button */}
      <button 
        className="ad-close-btn" 
        onClick={() => setIsVisible(false)}
        title="Hide Ad"
      >
        <X size={20} />
      </button>

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