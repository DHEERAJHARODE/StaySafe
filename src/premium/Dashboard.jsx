import { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, query, where, onSnapshot, doc } from "firebase/firestore"; // ✅ 'doc' import add kiya
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; 
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  LogOut, 
  Copy, 
  CheckCircle, 
  Clock,
  Menu, 
  X,
  FolderOpen,
  Share2,
  Upload 
} from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout, isPremium, loading } = useAuth();
  const navigate = useNavigate(); 
  const [activeTab, setActiveTab] = useState("overview");
  const [agreements, setAgreements] = useState([]);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbUserData, setDbUserData] = useState(null); // ✅ Database se exact user data laane ke liye state

  // ✅ PREMIUM LOCK LOGIC
  useEffect(() => {
    if (!loading && user && !isPremium) {
      alert("🔒 Premium Access Required! Redirecting to StaySafe Premium...");
      navigate("/premium"); 
    }
  }, [user, isPremium, loading, navigate]);

  // ✅ NEW FIX: Firestore se Profile Data Fetch Karna (Taki Gem wali photo aur naam aaye)
  useEffect(() => {
    if (!user?.uid) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setDbUserData(docSnap.data());
      }
    });
    return () => unsubscribeUser();
  }, [user]);

  // Form State
  const [formData, setFormData] = useState({
    propertyName: "",
    rentAmount: "",
    maxTenants: 1, 
    ownerAadhaar: "", 
    ownerSignature: "", 
    terms: "1. Rent must be paid by the 5th of every month.\n2. Security deposit is refundable.\n3. Keep the premises clean.", 
  });

  // ✅ GEM APP KI EXACT PROFILE PIC AUR NAAM YAHAN SE SET HOGA
  // Check karega: Pehle Database me dekhega -> Fir Auth me dekhega -> Warna Default Email ka naam uthayega
  const fullName = dbUserData?.displayName || dbUserData?.name || dbUserData?.firstName || user?.displayName || user?.email?.split("@")[0] || "User";
  const avatarUrl = dbUserData?.photoURL || dbUserData?.profilePic || dbUserData?.profileImage || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff&size=128&bold=true`;

  // Real-time listener for agreements
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "agreements"), where("ownerUid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAgreements(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, ownerSignature: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAgreement = async (e) => {
    e.preventDefault();
    if (!formData.propertyName || !formData.rentAmount || !formData.ownerAadhaar || !formData.ownerSignature) {
      return alert("Please fill all details, including Aadhaar and Signature.");
    }

    try {
      const accessKey = Math.random().toString(36).substring(2, 10).toUpperCase();
      await addDoc(collection(db, "agreements"), {
        ...formData,
        maxTenants: parseInt(formData.maxTenants) || 1,
        currentTenants: 0, 
        accessKey,
        ownerUid: user.uid,
        status: "pending",
        createdAt: new Date().toISOString(),
        tenantSignature: null
      });
      alert("Agreement Created! Share the Access Key with tenants.");
      setActiveTab("agreements");
      setFormData({ propertyName: "", rentAmount: "", maxTenants: 1, ownerAadhaar: "", ownerSignature: "", terms: formData.terms });
    } catch (err) {
      console.error("Error creating agreement:", err);
      alert("Error creating agreement. Please check your connection.");
    }
  };

  const copyKeyOnly = (keyText) => {
    navigator.clipboard.writeText(keyText);
    alert(`Access Key Copied: ${keyText}`);
  };

  const handleShare = async (accessKey, propertyName) => {
    const portalLink = `${window.location.origin}/portal`;
    const shareText = `Hello!\nPlease complete your tenant verification & agreement form for ${propertyName}.\n\nClick the link below to fill it out directly:\n${portalLink}\n\nAccess Key: ${accessKey}\nKindly enter given access key to fill the form.`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: "Tenant Agreement Form",
          text: shareText,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Portal Link & Key Copied to Clipboard! 🔗\n\nYou can now send it to your tenant via WhatsApp or Email.");
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "1.2rem", fontWeight: "bold", color: "#333" }}>
        Checking Premium Access... 🔒
      </div>
    );
  }

  if (!isPremium) {
    return null;
  }

  return (
    <div className="ssp-dashboard-wrapper">
      
      {/* Mobile Header Bar */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="mobile-brand" style={{ fontWeight: 900, color: "#172033", fontSize: "20px", letterSpacing: "-0.5px" }}>
          Stay Safe<span style={{ color: "#5A4BFF" }}>.</span>
        </span>
        <img src={avatarUrl} alt="User" className="mobile-avatar" style={{ objectFit: "cover" }} />
      </div>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`ssp-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <h2 style={{ fontWeight: 900, color: "#172033", margin: 0, letterSpacing: "-0.5px" }}>
              Stay Safe<span style={{ color: "#5A4BFF" }}>.</span>
            </h2>
          </div>
          <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="user-profile-mini">
          {/* ✅ Actual user photo rendering */}
          <img src={avatarUrl} alt="Profile" style={{ objectFit: "cover" }} />
          <div>
            {/* ✅ Actual Full Name rendering */}
            <h4 style={{ fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0", fontSize: "15px" }}>
              {fullName}
            </h4>
            <span className="role-badge">Owner</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button className={activeTab === "overview" ? "active" : ""} onClick={() => handleNavClick("overview")}>
            <LayoutDashboard size={20} /> Overview
          </button>
          <button className={activeTab === "create" ? "active" : ""} onClick={() => handleNavClick("create")}>
            <PlusCircle size={20} /> Create Agreement
          </button>
          <button className={activeTab === "agreements" ? "active" : ""} onClick={() => handleNavClick("agreements")}>
            <FileText size={20} /> My Agreements
          </button>
        </nav>

        <button className="logout-btn" onClick={logout}>
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-header desktop-only">
          <h1>
            {activeTab === "overview" && "Dashboard Overview"}
            {activeTab === "create" && "New Agreement"}
            {activeTab === "agreements" && "Manage Agreements"}
          </h1>
          <div className="date-badge">{new Date().toDateString()}</div>
        </header>

        <div className="mobile-page-title">
          <h2>
             {activeTab === "overview" && "Overview"}
             {activeTab === "create" && "New Agreement"}
             {activeTab === "agreements" && "Agreements"}
          </h2>
        </div>

        <div className="content-area">
          
          {/* OVERVIEW TAB with Stats Grid and Quick Actions */}
          {activeTab === "overview" && (
            <>
              <div className="stats-grid">
                <div className="stat-card" onClick={() => handleNavClick("agreements")}>
                  <div className="icon-box blue"><FileText size={24}/></div>
                  <div>
                    <h3>{agreements.length}</h3>
                    <p>Total Agreements</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="icon-box green"><CheckCircle size={24}/></div>
                  <div>
                    <h3>{agreements.filter(a => a.status === 'filled').length}</h3>
                    <p>Fully Signed</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="icon-box orange"><Clock size={24}/></div>
                  <div>
                    <h3>{agreements.filter(a => a.status === 'pending').length}</h3>
                    <p>Pending</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions for Mobile */}
              <div className="quick-actions-mobile desktop-hidden">
                <h3 className="section-title">Quick Actions</h3>
                <div className="quick-action-btns">
                  <button className="action-btn create-btn" onClick={() => handleNavClick("create")}>
                    <PlusCircle size={22} /> Create Agreement
                  </button>
                  <button className="action-btn manage-btn" onClick={() => handleNavClick("agreements")}>
                    <FolderOpen size={22} /> Manage Agreements
                  </button>
                </div>
              </div>
            </>
          )}

          {/* CREATE AGREEMENT TAB */}
          {activeTab === "create" && (
            <div className="form-card">
              <h2>Create Rental Agreement</h2>
              <form onSubmit={handleCreateAgreement}>
                <div className="form-group">
                  <label>Property Name / Address</label>
                  <input type="text" placeholder="e.g. Flat 101, Galaxy Apartment" value={formData.propertyName} onChange={(e) => setFormData({...formData, propertyName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Monthly Rent (₹)</label>
                  <input type="number" placeholder="e.g. 12000" value={formData.rentAmount} onChange={(e) => setFormData({...formData, rentAmount: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Number of Tenants</label>
                  <input type="number" min="1" placeholder="e.g. 2" value={formData.maxTenants} onChange={(e) => setFormData({...formData, maxTenants: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Owner Aadhaar Card Number</label>
                  <input 
                    type="text" 
                    maxLength="12"
                    placeholder="1234 5678 9012" 
                    value={formData.ownerAadhaar} 
                    onChange={(e) => setFormData({...formData, ownerAadhaar: e.target.value.replace(/\D/g, '')})} 
                  />
                </div>

                <div className="form-group">
                  <label>Upload Owner Signature (Image)</label>
                  <div className="file-upload-wrapper">
                    <input type="file" accept="image/*" onChange={handleSignatureChange} id="sig-upload" hidden />
                    <label htmlFor="sig-upload" className="file-upload-label">
                      {formData.ownerSignature ? (
                        <div className="sig-preview-box">
                          <img src={formData.ownerSignature} alt="Signature Preview" className="sig-preview-img" />
                          <span>Click to Change</span>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <Upload size={24} /> <span>Choose Signature Image</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Terms & Conditions</label>
                  <textarea rows="5" value={formData.terms} onChange={(e) => setFormData({...formData, terms: e.target.value})}></textarea>
                </div>
                <button type="submit" className="primary-btn">Generate Agreement</button>
              </form>
            </div>
          )}

          {/* MY AGREEMENTS TAB */}
          {activeTab === "agreements" && (
            <div className="table-container">
              {agreements.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} color="#cbd5e1"/>
                  <p>No agreements found. Create one to get started.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="agreements-table">
                    <thead>
                      <tr>
                        <th>Property Name</th>
                        <th className="mobile-hidden">Date Created</th>
                        <th>Status</th>
                        <th>Access Key</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agreements.map((ag) => (
                        <tr key={ag.id} className="agreement-card-row">
                          <td className="td-property">
                            <div className="property-title">{ag.propertyName}</div>
                            <div className="property-date desktop-hidden">Added on {new Date(ag.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="td-date mobile-hidden">{new Date(ag.createdAt).toLocaleDateString()}</td>
                          <td className="td-status">
                            <span className={`badge ${ag.status === 'filled' ? 'success' : 'pending'}`}>
                              {ag.currentTenants || 0} / {ag.maxTenants || 1} Signed
                            </span>
                          </td>
                          <td className="td-key">
                            <span className="key-label mobile-only">Access Key:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="key-text">{ag.accessKey}</span>
                              <button onClick={() => copyKeyOnly(ag.accessKey)} title="Copy Access Key" className="copy-key-btn">
                                <Copy size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="td-action">
                            <div className="action-buttons-wrapper">
                              <button 
                                onClick={() => navigate(`/agreement-details/${ag.id}`, { state: { agreement: ag } })}
                                className="open-folder-btn"
                              >
                                <FolderOpen size={18} /> <span>Open</span>
                              </button>
                              <button 
                                onClick={() => handleShare(ag.accessKey, ag.propertyName)}
                                className="share-btn"
                              >
                                <Share2 size={18} /> <span>Share</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}