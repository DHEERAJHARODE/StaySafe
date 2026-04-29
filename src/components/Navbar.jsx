import { NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  FiMenu,
  FiX,
  FiMessageSquare,
  FiUser,
  FiMessageCircle,
  FiPhoneCall,
  FiHelpCircle,
  FiLogOut,
  FiHome,
  FiGrid,
  FiMail,
  FiSettings,
  FiBell,
  FiFileText
} from "react-icons/fi";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout, isPremium } = useAuth();
  const navigate = useNavigate();

  // States
  const [profile, setProfile] = useState(null);
  const [unreadUsersCount, setUnreadUsersCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const dropdownRef = useRef(null);

  // 1. Scroll Effect (For transparent to solid navbar transition)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Fetch User Profile Data
  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      return;
    }
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setProfile(snap.data());
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [user?.uid]);

  // 3. Real-time Unread Messages (Chat System)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("seen", "==", false)
    );
    const unsubMessages = onSnapshot(q, (snap) => {
      const senders = snap.docs.map((d) => d.data().senderId);
      setUnreadUsersCount([...new Set(senders)].length);
    });
    return () => unsubMessages();
  }, [user?.uid]);

  // 4. Real-time Notifications & Booking Requests
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubNotifs = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubNotifs();
  }, [user?.uid]);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // 5. Close Dropdown on Outside Click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 6. Navigation Helpers
  const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");
  const sideClass = ({ isActive }) => (isActive ? "side-link active" : "side-link");

  const handleLogout = async () => {
    try {
      await logout();
      setMobileOpen(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <>
      {/* ================= MAIN NAVBAR ================= */}
      <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <div className="nav-container">
          {/* Logo Section */}
          <div className="nav-left">
            <h3 className="logo" onClick={() => navigate("/")}>
              Stay Safe<span className="logo-dot">.</span>
            </h3>
          </div>

          {/* DESKTOP LINKS - Only visible when logged in */}
          <div className="nav-links desktop">
            {user ? (
              <>
                <NavLink to="/" className={navClass} end>
                  <FiHome className="nav-icon-sm" /> Home
                </NavLink>
                <NavLink to="/rooms" className={navClass}>
                  <FiGrid className="nav-icon-sm" /> Rooms
                </NavLink>
                
                {/* Role-based Dynamic Request Link */}
                <NavLink 
                  to={profile?.role === "owner" ? "/booking-requests" : "/my-requests"} 
                  className={navClass}
                >
                  <FiMail className="nav-icon-sm" />
                  {profile?.role === "owner" ? "Booking Requests" : "My Bookings"}
                  {unreadNotifCount > 0 && (
                    <span className="link-badge pulse">{unreadNotifCount}</span>
                  )}
                </NavLink>

                <NavLink to="/dashboard" className={navClass}>
                  Dashboard
                </NavLink>

                {/* ✅ Premium Owner Agreements Link (Desktop) */}
                {profile?.role === "owner" && isPremium && (
                  <NavLink to="/ssp-dashboard" className={navClass}>
                    <FiFileText className="nav-icon-sm" /> Agreements
                    <span className="link-badge pro-badge">PRO</span>
                  </NavLink>
                )}
              </>
            ) : null}
          </div>

          {/* RIGHT ACTIONS */}
          <div className="nav-actions">
            {user ? (
              <div className="desktop-actions desktop">
                {/* Inbox Icon with Badge */}
                <NavLink to="/inbox" className="nav-icon-link tooltip-trigger">
                  <FiMessageSquare size={22} />
                  {unreadUsersCount > 0 && (
                    <span className="icon-badge">{unreadUsersCount}</span>
                  )}
                  <span className="tooltip">Messages</span>
                </NavLink>

                {/* Profile Dropdown Container */}
                <div className="profile-wrapper" ref={dropdownRef}>
                  <div 
                    className={`nav-avatar-container ${showProfileMenu ? "active-ring" : ""}`}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                    <img
                      src={profile?.profileImage || "https://www.w3schools.com/howto/img_avatar.png"}
                      alt="User Profile"
                      className="nav-avatar"
                    />
                  </div>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="profile-menu animate-slide-in">
                      <div className="menu-header">
                        <img 
                          src={profile?.profileImage || "https://www.w3schools.com/howto/img_avatar.png"} 
                          alt="avatar" 
                        />
                        <div className="user-info">
                          <p className="user-name">{profile?.name || "Member"}</p>
                          <p className="user-role-badge">{profile?.role || "user"}</p>
                          <p className="user-email-text">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="menu-items-grid">
                        <div className="menu-item" onClick={() => {navigate("/profile"); setShowProfileMenu(false)}}>
                          <FiUser /> <span>My Profile</span>
                        </div>
                        <div className="menu-item" onClick={() => {navigate("/dashboard"); setShowProfileMenu(false)}}>
                          <FiGrid /> <span>Dashboard</span>
                        </div>
                        <div className="menu-item" onClick={() => {navigate("/feedback"); setShowProfileMenu(false)}}>
                          <FiMessageCircle /> <span>Feedback</span>
                        </div>
                        <div className="menu-item" onClick={() => {navigate("/contact"); setShowProfileMenu(false)}}>
                          <FiPhoneCall /> <span>Contact</span>
                        </div>
                        <div className="menu-item" onClick={() => {navigate("/help"); setShowProfileMenu(false)}}>
                          <FiHelpCircle /> <span>Support</span>
                        </div>
                      </div>

                      <hr className="menu-divider" />
                      <div className="menu-item logout-text" onClick={handleLogout}>
                        <FiLogOut /> <span>Sign Out</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Auth Buttons for Logged Out Users */
              <div className="auth-btns desktop">
                <Link to="/login" className="login-link">Login</Link>
                <Link to="/register" className="reg-btn">Register</Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <div className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
              <div className="hamburger-box">
                {unreadNotifCount + unreadUsersCount > 0 && <span className="mobile-dot"></span>}
                <FiMenu size={28} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ================= MOBILE SIDEBAR (Drawer) ================= */}
      <div 
        className={`sidebar-overlay ${mobileOpen ? "active" : ""}`} 
        onClick={() => setMobileOpen(false)} 
      />

      <div className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">Stay Safe<span className="logo-dot">.</span></div>
          <FiX size={30} className="close-btn" onClick={() => setMobileOpen(false)} />
        </div>

        {user ? (
          <>
            {/* User Profile Card in Sidebar */}
            <div className="sidebar-profile" onClick={() => {navigate("/profile"); setMobileOpen(false)}}>
              <img 
                src={profile?.profileImage || "https://www.w3schools.com/howto/img_avatar.png"} 
                alt="profile" 
              />
              <div className="sidebar-user-details">
                <p className="sidebar-user-name">{profile?.name || "User"}</p>
                <p className="sidebar-user-email">{user.email}</p>
                <span className="sidebar-user-role">{profile?.role}</span>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <div className="sidebar-links">
              <NavLink to="/" className={sideClass} end onClick={() => setMobileOpen(false)}>
                <FiHome /> Home
              </NavLink>
              <NavLink to="/rooms" className={sideClass} onClick={() => setMobileOpen(false)}>
                <FiGrid /> Explore Rooms
              </NavLink>
              
              <NavLink 
                to={profile?.role === "owner" ? "/booking-requests" : "/my-requests"} 
                className={sideClass} 
                onClick={() => setMobileOpen(false)}
              >
                <FiMail /> 
                {profile?.role === "owner" ? "Requests" : "My Bookings"}
                {unreadNotifCount > 0 && (
                  <span className="sidebar-badge">{unreadNotifCount}</span>
                )}
              </NavLink>

              <NavLink to="/inbox" className={sideClass} onClick={() => setMobileOpen(false)}>
                <FiMessageSquare /> Messages
                {unreadUsersCount > 0 && (
                  <span className="sidebar-badge-msg">{unreadUsersCount}</span>
                )}
              </NavLink>

              <NavLink to="/dashboard" className={sideClass} onClick={() => setMobileOpen(false)}>
                <FiGrid /> Dashboard
              </NavLink>

              {/* ✅ Premium Owner Agreements Link (Mobile) */}
              {profile?.role === "owner" && isPremium && (
                <NavLink to="/ssp-dashboard" className={sideClass} onClick={() => setMobileOpen(false)}>
                  <FiFileText /> Agreements
                  <span className="sidebar-badge pro-badge">PRO</span>
                </NavLink>
              )}

              <div className="sidebar-divider">Other</div>

              <NavLink to="/profile" className={sideClass} onClick={() => setMobileOpen(false)}>
                <FiUser /> Profile Settings
              </NavLink>
              <NavLink to="/contact" className={sideClass} onClick={() => setMobileOpen(false)}>
                <FiPhoneCall /> Contact Us
              </NavLink>
              
              <button className="sidebar-logout-btn" onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </div>
          </>
        ) : (
          /* Sidebar Auth for Logged Out Users */
          <div className="sidebar-auth-content">
            <p className="auth-msg">Welcome to Stay Safe. Please sign in to manage your bookings.</p>
            <div className="sidebar-auth-grid">
              <Link to="/login" className="side-login" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/register" className="side-reg" onClick={() => setMobileOpen(false)}>Register</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;