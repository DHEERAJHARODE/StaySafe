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

        <div className="form-group">
          <label>Location</label>
          <input
            placeholder="e.g. Andheri East, Mumbai"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        {/* Available For */}
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

        {/* Toggle Button */}
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

          {imagePreview && <img src={imagePreview} alt="Preview" />}
        </div>

        <button disabled={loading}>
          {loading ? "Saving..." : "Publish Room"}
        </button>
      </form>
    </div>
  );
};

export default AddRoom;
