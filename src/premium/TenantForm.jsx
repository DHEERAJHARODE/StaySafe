import { useRef, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import "./TenantForm.css";

export default function TenantForm() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    address: "",
    aadhaarNo: "",
    mobile: "",
    selfie: "",
    aadhaarFront: "",
    aadhaarBack: "",
    panCard: "",
    signature: ""
  });

  // Camera Logic for Selfie
  const startCamera = async () => {
    setShowCamera(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    const base64 = canvas.toDataURL("image/png");
    setFormData({ ...formData, selfie: base64 });
    
    // Stop camera tracks
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  // Helper function to convert File to Base64
  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Images are already in Base64 (text form) within formData
      await addDoc(collection(db, "tenants"), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      alert("Tenant data and images saved successfully in Firestore!");
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      alert("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Tenant Registration</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Full Name" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
        <input type="text" placeholder="Father's Name" required onChange={(e) => setFormData({...formData, fatherName: e.target.value})} />
        <textarea placeholder="Permanent Address" required onChange={(e) => setFormData({...formData, address: e.target.value})} />
        
        <div className="upload-section">
          <label>Selfie (Capture via Camera)</label>
          {showCamera ? (
            <div className="camera-box">
              <video ref={videoRef} width="320" height="240" autoPlay />
              <button type="button" onClick={captureImage}>Capture</button>
            </div>
          ) : (
            <button type="button" onClick={startCamera}>Start Camera</button>
          )}
          {formData.selfie && <img src={formData.selfie} className="preview-img" alt="Selfie Preview" />}
        </div>

        <div className="upload-section">
          <label>Aadhaar Front Side</label>
          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "aadhaarFront")} />
        </div>

        <div className="upload-section">
          <label>Aadhaar Back Side</label>
          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "aadhaarBack")} />
        </div>

        <div className="upload-section">
          <label>Signature Image</label>
          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "signature")} />
        </div>

        <canvas ref={canvasRef} width="320" height="240" style={{ display: "none" }} />
        
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Saving Data..." : "Submit Registration"}
        </button>
      </form>
    </div>
  );
}