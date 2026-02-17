import { useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import "./AddRoom.css";

const AddRoom = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [rent, setRent] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locationLoading, setLocationLoading] = useState(false); // New loading state for location

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const [availableNow, setAvailableNow] = useState(true);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableFor, setAvailableFor] = useState([]);

  const toggleAvailableFor = (value) => {
    setAvailableFor((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  // Get Location & Auto-Fill Address
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        try {
          // Reverse Geocoding using OpenStreetMap (Free API)
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          
          if (data && data.display_name) {
            // Address format karke set karna
            const addressParts = [
              data.address.suburb || data.address.neighbourhood,
              data.address.city || data.address.town || data.address.village,
              data.address.state
            ].filter(Boolean); // Filter out undefined/null parts
            
            setLocation(addressParts.join(", ") || data.display_name);
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          alert("Coordinates fetched, but failed to auto-fill address. Please type manually.");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        alert("Unable to retrieve location. Please check browser permissions.");
        console.error(error);
      }
    );
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (availableFor.length === 0) {
      alert("Please select who the room is available for");
      setLoading(false);
      return;
    }

    if (!availableNow && !availableFrom) {
      alert("Please select available date");
      setLoading(false);
      return;
    }

    try {
      let imageBase64 = null;

      if (imageFile) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(imageFile, options);
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
      }

      await addDoc(collection(db, "rooms"), {
        title,
        rent: Number(rent),
        location,
        latitude: coords.lat,
        longitude: coords.lng,
        image: imageBase64,
        ownerId: user.uid,
        status: "available",
        availableNow,
        availableFrom: availableNow ? null : availableFrom,
        availableFor,
        createdAt: new Date(),
      });

      alert("Room listed successfully 🎉");
      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-room-page">
      <form className="add-room-card" onSubmit={handleAddRoom}>
        <h2>List a New Room</h2>
        <p className="subtitle">
          Fill in the details to start receiving booking requests
        </p>

        <div className="form-group">
          <label>Room Title</label>
          <input
            placeholder="e.g. Fully furnished room near metro"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Monthly Rent (₹)</label>
          <input
            type="number"
            placeholder="e.g. 8000"
            value={rent}
            onChange={(e) => setRent(e.target.value)}
            required
          />
        </div>

        {/* Updated Location Field */}
        <div className="form-group">
          <label>Location</label>
          <div className="location-input-wrapper">
            <input
              placeholder="e.g. Andheri East, Mumbai"
              value={locationLoading ? "Fetching address..." : location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={locationLoading}
              required
            />
            <button 
              type="button" 
              className="location-btn"
              onClick={handleGetCurrentLocation}
              disabled={locationLoading}
              title="Get My Current Location"
            >
              {locationLoading ? "⏳" : "📍"}
            </button>
          </div>
          {coords.lat && <span className="location-success">Address and Map Coordinates captured!</span>}
        </div>

        <div className="form-group">
          <label>Available For</label>
          <div className="checkbox-grid">
            {["family", "boys", "girls"].map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={availableFor.includes(type)}
                  onChange={() => toggleAvailableFor(type)}
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="toggle-label">
            <span>Room is available now</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={availableNow}
                onChange={(e) => setAvailableNow(e.target.checked)}
              />
              <span className="slider"></span>
            </div>
          </label>
        </div>

        {!availableNow && (
          <div className="form-group">
            <label>Available From</label>
            <input
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Room Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setImageFile(file);
              const reader = new FileReader();
              reader.onloadend = () => setImagePreview(reader.result);
              reader.readAsDataURL(file);
            }}
            required
          />
          {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview" />}
        </div>

        <button className="submit-btn" disabled={loading}>
          {loading ? "Saving..." : "Publish Room"}
        </button>
      </form>
    </div>
  );
};

export default AddRoom;