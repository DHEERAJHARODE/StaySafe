import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import "./TenantAgreement.css"; 

export default function TenantAgreement() {
  const { key } = useParams();
  const navigate = useNavigate();
  
  // Camera Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  const [agreementData, setAgreementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Updated State matching 'index.html' fields
  const [tenantData, setTenantData] = useState({
    name: "",
    fatherName: "",
    address: "",
    aadhaar: "",
    aadhaarFront: "", // File
    aadhaarBack: "",  // File
    pan: "",
    panCard: "",      // File
    mobile: "",
    signature: "",    // File
    selfie: ""        // Camera Capture
  });

  // 1. Fetch Agreement
  useEffect(() => {
    const fetchAgreement = async () => {
      if (!key) return;
      try {
        const q = query(collection(db, "agreements"), where("accessKey", "==", key.toUpperCase()));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (data.status === "filled") {
            setError("⛔ This agreement is already signed/closed.");
          } else {
            setAgreementData({ id: snapshot.docs[0].id, ...data });
          }
        } else {
          setError("❌ Invalid Link or Key Expired.");
        }
      } catch (err) {
        console.error(err);
        setError("Network Error.");
      } finally {
        setLoading(false);
      }
    };
    fetchAgreement();
  }, [key]);

  // Handle Inputs
  const handleInput = (e) => {
    setTenantData({ ...tenantData, [e.target.name]: e.target.value });
  };

  // Handle File Uploads (Base64 conversion)
  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTenantData((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 📸 Camera Logic (Selfie)
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied!");
      setShowCamera(false);
    }
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 320, 240);
    const imageSrc = canvas.toDataURL("image/png");
    
    setTenantData(prev => ({ ...prev, selfie: imageSrc }));
    
    // Stop Stream
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!tenantData.aadhaarFront || !tenantData.aadhaarBack || !tenantData.panCard || !tenantData.signature || !tenantData.selfie) {
      alert("⚠️ Please upload ALL required photos and take a selfie.");
      return;
    }

    setLoading(true);

    try {
      // Save Tenant
      const tenantRef = await addDoc(collection(db, "tenants"), {
        ...tenantData,
        agreementId: agreementData.id,
        filledAt: new Date().toISOString()
      });

      // Update Agreement
      await updateDoc(doc(db, "agreements", agreementData.id), {
        status: "filled",
        tenantName: tenantData.name,
        tenantId: tenantRef.id
      });

      alert("✅ Agreement Signed Successfully!");
      navigate("/view-contract", { state: { agreement: agreementData, tenant: tenantData } });

    } catch (err) {
      console.error(err);
      alert("Error saving data. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading Agreement...</div>;
  if (error) return <div className="error-screen"><h2>{error}</h2></div>;

  return (
    <div className="agreement-wrapper">
      <div className="agreement-container">
        
        {/* Header */}
        <header className="agreement-header">
          <h1>Rental Agreement</h1>
          <p>Please fill all details correctly.</p>
        </header>

        {/* Details & Terms */}
        <div className="details-card">
          <h3>🏡 Property: {agreementData.propertyName}</h3>
          <p><strong>Rent:</strong> ₹{agreementData.rentAmount}</p>
          <div className="terms-box">
             <h4>Terms:</h4>
             <ul>{typeof agreementData.terms === 'string' 
  ? agreementData.terms.split('\n').map((term, index) => (
      <li key={index}>{term}</li>
    ))
  : Array.isArray(agreementData.terms) 
    ? agreementData.terms.map((term, index) => (
        <li key={index}>{term}</li>
      ))
    : <li>{agreementData.terms}</li>
}</ul>
          </div>
        </div>

        {/* MAIN FORM */}
        <div className="form-card">
          <h3>👤 Tenant Details</h3>
          <form onSubmit={handleSubmit}>
            
            {/* 1. Name & Father Name */}
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input name="name" type="text" onChange={handleInput} required />
              </div>
              <div className="form-group">
                <label>Father/Husband Name *</label>
                <input name="fatherName" type="text" onChange={handleInput} required />
              </div>
            </div>

            {/* 2. Address & Mobile */}
            <div className="form-group">
              <label>Permanent Address *</label>
              <textarea name="address" rows="2" onChange={handleInput} required></textarea>
            </div>
            <div className="form-group">
              <label>Mobile Number *</label>
              <input name="mobile" type="tel" onChange={handleInput} required pattern="[0-9]{10}" title="10 digit mobile number" />
            </div>

            {/* 3. Aadhaar Details */}
            <div className="form-group">
              <label>Aadhaar Number *</label>
              <input name="aadhaar" type="text" onChange={handleInput} required pattern="\d{12}" title="12 digit Aadhaar number" />
            </div>
            <div className="upload-row">
               <div className="upload-box">
                 <label>Aadhaar Front *</label>
                 <input type="file" accept="image/*" onChange={(e)=>handleFileUpload(e, 'aadhaarFront')} required />
                 {tenantData.aadhaarFront && <span className="success-icon">✅ Uploaded</span>}
               </div>
               <div className="upload-box">
                 <label>Aadhaar Back *</label>
                 <input type="file" accept="image/*" onChange={(e)=>handleFileUpload(e, 'aadhaarBack')} required />
                 {tenantData.aadhaarBack && <span className="success-icon">✅ Uploaded</span>}
               </div>
            </div>

            {/* 4. PAN Details */}
            <div className="form-group">
              <label>PAN Number *</label>
              <input name="pan" type="text" onChange={handleInput} required pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" title="Valid PAN Number" />
            </div>
            <div className="upload-box">
               <label>PAN Card Photo *</label>
               <input type="file" accept="image/*" onChange={(e)=>handleFileUpload(e, 'panCard')} required />
               {tenantData.panCard && <span className="success-icon">✅ Uploaded</span>}
            </div>

            {/* 5. Signature */}
            <div className="upload-box" style={{marginTop:'15px'}}>
               <label>✍️ Signature *</label>
               <input type="file" accept="image/*" onChange={(e)=>handleFileUpload(e, 'signature')} required />
               {tenantData.signature && <img src={tenantData.signature} alt="Sign" className="preview-thumb" />}
            </div>

            {/* 6. Live Selfie */}
            <div className="camera-section">
              <label>📸 Live Selfie *</label>
              {showCamera ? (
                <div className="camera-view">
                  <video ref={videoRef} autoPlay playsInline width="320" height="240"></video>
                  <button type="button" onClick={captureImage} className="capture-btn">Click Selfie</button>
                </div>
              ) : (
                !tenantData.selfie && <button type="button" onClick={startCamera} className="cam-btn">Start Camera</button>
              )}
              
              {/* Selfie Preview */}
              {tenantData.selfie && (
                <div className="preview-box">
                  <img src={tenantData.selfie} alt="Selfie" width="320" />
                  <button type="button" onClick={startCamera} className="retake-btn">Retake</button>
                </div>
              )}
              
              {/* Hidden Canvas for capture */}
              <canvas ref={canvasRef} width="320" height="240" style={{display:'none'}}></canvas>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Processing..." : "Submit Agreement"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}