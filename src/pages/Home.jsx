import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { 
  FiSearch, FiCheckCircle, FiShield, FiMapPin, FiStar, FiArrowRight, FiHeart 
} from "react-icons/fi";

// Swiper Components and Styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

// Modular Components
import Footer from "../components/Footer"; 
import PremiumAdBanner from "../components/PremiumAdBanner"; // ✅ Ad Banner Import Kiya
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [favorites, setFavorites] = useState({}); 

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRooms(list); 
    });
    return () => unsubscribe();
  }, []);

  const toggleFavorite = (e, id) => {
    e.stopPropagation(); 
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="home-wrapper">
      {/* ================= HERO SECTION ================= */}
      <section className="hero-section">
        <div className="hero-container">
          <span className="hero-tagline">Built for Trust & Safety</span>
          <h1>Premium Rooms for <br /><span>Smart Living.</span></h1>
          <p>Ditch the brokers. Find verified rooms with direct owner contact in minutes.</p>
          <div className="hero-search-bar">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by city or area..." 
              readOnly 
              onClick={() => navigate("/rooms")} 
            />
            <button onClick={() => navigate("/rooms")}>Explore Now</button>
          </div>
        </div>
      </section>

      {/* ================= FEATURED PROPERTIES ================= */}
      <section className="rooms-section">
        <div className="container">
          
          {/* ✅ PREMIUM AD BANNER YAHAN LAGA DIYA */}
          {/* Agar user premium hoga, toh ye apne aap hide ho jayega */}
          <PremiumAdBanner />

          <div className="section-title-area">
            <div>
              <span className="sub-title">Handpicked for you</span>
              <h2>Featured Properties</h2>
            </div>
            <Link to="/rooms" className="btn-link">View All <FiArrowRight /></Link>
          </div>

          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={25}
            slidesPerView={1}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className="featured-swiper"
          >
            {rooms.slice(0, 8).map((room) => (
              <SwiperSlide key={room.id}>
                <div className="premium-card" onClick={() => navigate(`/room/${room.id}`)}>
                  <div className="card-img-wrapper">
                    {room.image ? (
                      <img src={room.image} alt={room.title} />
                    ) : (
                      <div className="placeholder">Premium Room</div>
                    )}
                    <span className="card-badge">Verified</span>
                    <button 
                      className={`heart-btn ${favorites[room.id] ? 'active' : ''}`} 
                      onClick={(e) => toggleFavorite(e, room.id)}
                    >
                      <FiHeart fill={favorites[room.id] ? "currentColor" : "none"} />
                    </button>
                    <div className="card-price">₹{room.rent}<span>/mo</span></div>
                  </div>
                  <div className="card-body">
                    <div className="card-meta"><FiMapPin /> {room.location}</div>
                    <h3>{room.title}</h3>
                    <div className="card-footer-info">
                      <span className="rating"><FiStar /> 4.8</span>
                      <span className="view-btn">Details</span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ================= TRUST STRIP ================= */}
      <section className="trust-strip">
        <div className="trust-item"><FiShield /> <span>Verified Owners</span></div>
        <div className="trust-item"><FiCheckCircle /> <span>No Brokerage</span></div>
        <div className="trust-item"><FiStar /> <span>Premium Experience</span></div>
        <div className="trust-item"><FiShield /> <span>Safe Bookings</span></div>
      </section>

      {/* ================= REUSABLE FOOTER ================= */}
      <Footer />
    </div>
  );
};

export default Home;