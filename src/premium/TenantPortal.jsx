import React, { useState, useRef } from 'react';
import { db } from "../firebase/firebaseConfig";
import { getDocs, query, collection, where, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Camera, ShieldCheck, User, MapPin, Phone, CreditCard, FileText, Image as ImageIcon } from 'lucide-react';
import './TenantPortal.css'; // ✅ Imported CSS

const TenantPortal = () => {
  const navigate = useNavigate();
  
  const [key, setKey] = useState('');
  const [agreement, setAgreement] = useState(null);
  const [fetching, setFetching] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tenantData, setTenantData] = useState({
    name: "", fatherName: "", address: "", mobile: "",
    aadhaar: "", aadhaarFront: "", aadhaarBack: "",  
    pan: "", panCard: "", signature: "", selfie: ""        
  });

  const fetchByKey = async () => {
    if(!key) return alert("Please enter a key!");
    setFetching(true);

    try {
        const finalKey = key.trim().toUpperCase();
        const q = query(collection(db, "agreements"), where("accessKey", "==", finalKey));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            const data = snap.docs[0].data();
            const current = data.currentTenants || 0;
            const max = data.maxTenants || 1;

            if(current >= max) {
                alert(`⛔ This agreement is already fully signed by all ${max} tenants.`);
                setAgreement(null);
            } else {
                setAgreement({ id: snap.docs[0].id, ...data });
            }
        } else {
            alert("❌ Invalid Key! Please check with the owner.");
        }
    } catch (error) {
        console.error("Error fetching:", error);
        alert("Network Error.");
    } finally {
        setFetching(false);
    }
  };

  const handleInput = (e) => {
    setTenantData({ ...tenantData, [e.target.name]: e.target.value });
  };

  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 800;
            let scaleSize = 1;
            if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
            
            canvas.width = img.width * scaleSize;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL("image/jpeg", 0.6));
        };
    };
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) compressImage(file, (base64) => setTenantData((prev) => ({ ...prev, [field]: base64 })));
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
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
    setTenantData(prev => ({ ...prev, selfie: canvas.toDataURL("image/jpeg", 0.7) }));
    
    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantData.aadhaarFront || !tenantData.aadhaarBack || !tenantData.panCard || !tenantData.signature || !tenantData.selfie) {
      return alert("⚠️ Please upload all required photos and take a selfie.");
    }
    setSubmitting(true);

    try {
      const tenantRef = await addDoc(collection(db, "tenants"), {
        ...tenantData, agreementId: agreement.id, filledAt: new Date().toISOString()
      });

      const currentCount = (agreement.currentTenants || 0) + 1;
      const maxAllowed = agreement.maxTenants || 1;

      await updateDoc(doc(db, "agreements", agreement.id), {
        currentTenants: increment(1),
        status: currentCount >= maxAllowed ? "filled" : "pending"
      });

      alert("✅ Agreement Signed Successfully!");
      navigate("/view-contract", { state: { agreement: agreement, tenant: tenantData } });
    } catch (err) {
      console.error(err);
      alert("Error submitting form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-wrapper">
      <div className="portal-card">
        
        {/* STATE 1: ENTER KEY */}
        {!agreement ? (
          <div>
            <ShieldCheck size={70} className="portal-icon" />
            <h1 className="portal-title">Secure Tenant Portal</h1>
            <p className="portal-subtitle">Enter the 8-character access key provided by your owner.</p>
            
            <div className="key-input-container">
                <input 
                  className="key-input" 
                  maxLength={8} 
                  placeholder="XXXXXXXX" 
                  onChange={e => setKey(e.target.value)} 
                />
                <button 
                  onClick={fetchByKey} 
                  disabled={fetching}
                  className="verify-btn"
                >
                  {fetching ? "Verifying..." : "Access Agreement"}
                </button>
            </div>
          </div>
        ) : (
          /* STATE 2: FILL FORM (FULL) */
          <div className="text-left">
            
            {/* Agreement Info Header */}
            <div className="agreement-info">
              <h2><MapPin size={22}/> {agreement.propertyName}</h2>
              <div className="badge-row">
                 <span className="info-badge">Rent: ₹{agreement.rentAmount}/month</span>
                 <span className="info-badge">Signatures Required: {(agreement.currentTenants || 0)} / {agreement.maxTenants || 1}</span>
              </div>
              
              <div className="terms-section">
                <p className="terms-title"><FileText size={16} className="inline mr-1"/> Terms & Conditions</p>
                {agreement.terms && Array.isArray(agreement.terms) ? (
                    <ul>{agreement.terms.map((t, i) => <li key={i}>{t}</li>)}</ul>
                ) : (
                    <p style={{margin:0, fontSize:'14px', color:'#475569'}}>{agreement.terms || 'No terms provided.'}</p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
                
                {/* 1. Personal Details */}
                <h3 className="form-section-title"><User size={20} className="text-blue-600"/> Personal Details</h3>
                <div className="form-grid">
                    <div className="input-wrapper">
                        <label>Full Name (As per Aadhaar) *</label>
                        <div className="tenant-input-box">
                            <User size={18} className="input-icon"/>
                            <input name="name" className="tenant-input" placeholder="Enter full name" required onChange={handleInput} />
                        </div>
                    </div>
                    <div className="input-wrapper">
                        <label>Father/Husband's Name *</label>
                        <div className="tenant-input-box">
                            <User size={18} className="input-icon"/>
                            <input name="fatherName" className="tenant-input" placeholder="Enter name" required onChange={handleInput} />
                        </div>
                    </div>
                    <div className="input-wrapper col-span-2">
                        <label>Permanent Address *</label>
                        <div className="tenant-input-box textarea-box">
                            <MapPin size={18} className="input-icon"/>
                            <textarea
                              name="address"
                              rows="2"
                              className="tenant-input"
                              placeholder="Complete address with pincode"
                              required
                              onChange={handleInput}
                            />
                        </div>
                    </div>
                    <div className="input-wrapper">
                        <label>Mobile Number *</label>
                        <div className="tenant-input-box">
                            <Phone size={18} className="input-icon"/>
                            <input name="mobile" type="tel" maxLength={10} className="tenant-input" placeholder="10-digit number" required onChange={handleInput} />
                        </div>
                    </div>
                </div>

                {/* 2. Documents */}
                <h3 className="form-section-title"><CreditCard size={20} className="text-blue-600"/> Document Proofs</h3>
                <div className="form-grid">
                    <div className="upload-card">
                        <label style={{fontWeight:'600', color:'#475569', fontSize:'14px', display:'block', marginBottom:'8px'}}>Aadhaar Number *</label>
                        <input name="aadhaar" placeholder="12 Digit Aadhaar" maxLength={12} className="tenant-input" style={{border:'1px solid #cbd5e1', marginBottom:'15px'}} required onChange={handleInput} />
                        
                        <label style={{fontSize:'12px', fontWeight:'700', color:'#64748b'}}>Aadhaar Front Photo *</label>
                        <input type="file" accept="image/*" className="upload-input-styled" onChange={(e)=>handleFileUpload(e, 'aadhaarFront')} required />
                        
                        <label style={{fontSize:'12px', fontWeight:'700', color:'#64748b', marginTop:'15px', display:'block'}}>Aadhaar Back Photo *</label>
                        <input type="file" accept="image/*" className="upload-input-styled" onChange={(e)=>handleFileUpload(e, 'aadhaarBack')} required />
                    </div>

                    <div className="upload-card">
                        <label style={{fontWeight:'600', color:'#475569', fontSize:'14px', display:'block', marginBottom:'8px'}}>PAN Number *</label>
                        <input name="pan" placeholder="ABCDE1234F" maxLength={10} className="tenant-input" style={{border:'1px solid #cbd5e1', marginBottom:'15px', textTransform:'uppercase'}} required onChange={handleInput} />
                        
                        <label style={{fontSize:'12px', fontWeight:'700', color:'#64748b'}}>PAN Card Photo *</label>
                        <input type="file" accept="image/*" className="upload-input-styled" onChange={(e)=>handleFileUpload(e, 'panCard')} required />
                    </div>
                </div>

                {/* 3. Verification */}
                <h3 className="form-section-title"><ImageIcon size={20} className="text-blue-600"/> Identity Verification</h3>
                <div className="form-grid">
                    
                    {/* Signature */}
                    <div className="portal-camera-box" style={{justifyContent: 'center'}}>
                        <label style={{fontWeight:'700', color:'#334155'}}>Upload Signature (Photo) *</label>
                        <p style={{fontSize:'12px', color:'#64748b', margin:'0 0 10px 0'}}>Sign on a blank paper and take a photo</p>
                        <input type="file" accept="image/*" className="upload-input-styled" onChange={(e)=>handleFileUpload(e, 'signature')} required />
                        {tenantData.signature && <img src={tenantData.signature} style={{height:'60px', marginTop:'15px', border:'1px dashed #cbd5e1', borderRadius:'8px', padding:'5px'}} alt="Signature"/>}
                    </div>

                    {/* Selfie */}
                    <div className="portal-camera-box">
                        <label style={{fontWeight:'700', color:'#334155'}}>Live Selfie Verification *</label>
                        {showCamera ? (
                            <div className="camera-preview-container">
                                <video ref={videoRef} autoPlay playsInline className="camera-preview"></video>
                                <button type="button" onClick={captureImage} className="capture-btn">📸 Capture</button>
                            </div>
                        ) : (
                            !tenantData.selfie ? (
                                <button type="button" onClick={startCamera} className="start-camera-btn">
                                    <Camera size={18}/> Start Camera
                                </button>
                            ) : (
                                <div className="camera-preview-container">
                                    <img src={tenantData.selfie} className="camera-preview" alt="Selfie" />
                                    <button type="button" onClick={()=>setTenantData({...tenantData, selfie: ''})} className="retake-btn">Retake</button>
                                </div>
                            )
                        )}
                        <canvas ref={canvasRef} className="hidden" width="320" height="240"></canvas>
                    </div>

                </div>

                <button type="submit" disabled={submitting} className="submit-agreement-btn">
                    {submitting ? "⏳ Processing & Encrypting..." : "Sign & Generate Legal Agreement"}
                </button>

            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantPortal;