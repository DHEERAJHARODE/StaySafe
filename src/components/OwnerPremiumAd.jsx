import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Sparkles, ShieldCheck, FileSignature, X } from 'lucide-react'; // ✅ X icon add kiya
import './OwnerPremiumAd.css'; 

const OwnerPremiumAd = () => {
  const { user, isPremium, loading } = useAuth();
  const navigate = useNavigate();
  
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true); // ✅ Ad dikhane ke liye state

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

  // ✅ MAIN LOGIC: Agar cross click kiya ho, ya premium ho, ya owner na ho -> Hide ad
  if (!isVisible || loading || roleLoading || !user || isPremium || role !== "owner") {
    return null; 
  }

  return (
    <div className="owner-premium-banner">
      {/* ✅ Top Right Cross Button */}
      <button 
        className="op-close-btn" 
        onClick={() => setIsVisible(false)}
        title="Hide Ad"
      >
        <X size={20} />
      </button>

      <div className="op-glow"></div>
      
      <div className="op-content">
        <div className="op-badge">
          <Sparkles size={14} /> OWNER PRO
        </div>
        <h3 className="op-title">Grow Your Renting Business with Ease</h3>
        <p className="op-desc">
          Legally binding digital agreements aur instant tenant verification ke saath apne business ko secure aur fast banayein.
        </p>
        
        <div className="op-features">
          <span className="op-feature-tag"><FileSignature size={14} /> Digital Agreements</span>
          <span className="op-feature-tag"><ShieldCheck size={14} /> Tenant Verification</span>
        </div>
      </div>

      <div className="op-action">
        <button onClick={() => navigate('/premium')} className="op-upgrade-btn">
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
};

export default OwnerPremiumAd;