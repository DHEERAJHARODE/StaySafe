import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ArrowLeft, Folder, User, FileText, X } from "lucide-react";
import "./AgreementDetails.css"; // CSS hum niche banayenge

export default function AgreementDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const agreement = location.state?.agreement;

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null); // Jis folder par click kiya

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const q = query(collection(db, "tenants"), where("agreementId", "==", id));
        const snap = await getDocs(q);
        setTenants(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching tenants:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, [id]);

  if (!agreement) {
    return <div className="p-8 text-center"><p>Agreement not found.</p><button onClick={()=>navigate(-1)}>Go Back</button></div>;
  }

  return (
    <div className="folder-page-wrapper">
      
      {/* Header */}
      {/* 100% BULLETPROOF HEADER (No Classes, Only Inline Styles) */}
      <div style={{ padding: "20px 5%", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        
        {/* Top Row: Back Button */}
        <div style={{ display: "block", marginBottom: "16px" }}>
          <button 
            onClick={() => navigate("/dashboard")} 
            style={{
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              padding: "10px 16px", 
              border: "1px solid #cbd5e1", 
              borderRadius: "10px", 
              backgroundColor: "#f8fafc", 
              cursor: "pointer",
              fontWeight: "600",
              color: "#334155",
              fontSize: "14px"
            }}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>
        
        {/* Bottom Row: Text Info */}
        <div style={{ display: "block" }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "22px", color: "#0f172a", fontWeight: "800", lineHeight: "1.4" }}>
            {agreement.propertyName} - Tenant Documents
          </h1>
          <p style={{ margin: 0, color: "#475569", fontSize: "14px", fontWeight: "500", lineHeight: "1.6" }}>
            Access Key: <span style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: "6px", fontWeight: "bold", border: "1px solid #bfdbfe" }}>{agreement.accessKey}</span> | Total Signatures: {tenants.length}/{agreement.maxTenants}
          </p>
        </div>

      </div>

      {/* Main Content */}
      <div className="folder-container">
        
        {loading ? (
          <p className="loading-text">Loading tenant folders...</p>
        ) : tenants.length === 0 ? (
          <div className="empty-folders">
            <Folder size={64} className="empty-icon" />
            <p>No one has signed this agreement yet.</p>
          </div>
        ) : (
          <>
            {/* FOLDER GRID VIEW */}
            {!selectedTenant ? (
              <div className="folders-grid">
                {tenants.map((tenant, index) => (
                  <div key={tenant.id} className="tenant-folder" onClick={() => setSelectedTenant(tenant)}>
                    <div className="folder-icon-wrapper">
                      <Folder size={60} fill="#fcd34d" stroke="#f59e0b" strokeWidth={1} />
                      <span className="folder-number">{index + 1}</span>
                    </div>
                    <h3 className="folder-name">{tenant.name}</h3>
                    <p className="folder-date">Signed: {new Date(tenant.filledAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              
              /* DETAILED DOCUMENT VIEW (When Folder is Opened) */
              <div className="document-viewer">
                <div className="doc-header">
                  <div className="flex items-center gap-3">
                    <User size={28} className="text-blue-600" />
                    <h2>{selectedTenant.name}'s Documents</h2>
                  </div>
                  <button className="close-doc-btn" onClick={() => setSelectedTenant(null)}>
                    <X size={20} /> Close Folder
                  </button>
                </div>

                <div className="doc-grid">
                  {/* Basic Info */}
                  <div className="doc-card info-card">
                    <h3>Tenant Details</h3>
                    <p><strong>Father/Husband:</strong> {selectedTenant.fatherName}</p>
                    <p><strong>Mobile:</strong> {selectedTenant.mobile}</p>
                    <p><strong>Aadhaar:</strong> {selectedTenant.aadhaar}</p>
                    <p><strong>PAN:</strong> {selectedTenant.pan}</p>
                    <p><strong>Address:</strong> {selectedTenant.address}</p>
                  </div>

                  {/* Selfie */}
                  <div className="doc-card">
                    <h3>Live Selfie</h3>
                    <img src={selectedTenant.selfie} alt="Selfie" className="preview-img" />
                  </div>

                  {/* Aadhaar */}
                  <div className="doc-card">
                    <h3>Aadhaar Card (Front & Back)</h3>
                    <div className="flex gap-2">
                      <img src={selectedTenant.aadhaarFront} alt="Aadhaar Front" className="preview-img w-half" />
                      <img src={selectedTenant.aadhaarBack} alt="Aadhaar Back" className="preview-img w-half" />
                    </div>
                  </div>

                  {/* PAN & Signature */}
                  <div className="doc-card">
                    <h3>PAN & Signature</h3>
                    <img src={selectedTenant.panCard} alt="PAN" className="preview-img mb-2" />
                    <div className="sign-preview-box">
                      <p className="text-xs text-gray-500">Signature on record</p>
                      <img src={selectedTenant.signature} alt="Sign" className="sign-img-small" />
                    </div>
                  </div>
                </div>

                {/* View Full Contract Button */}
                <div className="contract-action">
                  <button 
                    onClick={() => navigate("/view-contract", { state: { agreement, tenant: selectedTenant } })}
                    className="view-contract-btn"
                  >
                    <FileText size={20} /> View Final Generated Contract
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}