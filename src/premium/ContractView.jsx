import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./ContractView.css";

export default function ContractView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { agreement, tenant } = location.state || {};

  if (!agreement || !tenant) {
    return (
      <div className="error-container">
        <h2>No Agreement Data Found</h2>
        <button onClick={() => navigate("/dashboard")} className="back-btn">Go to Dashboard</button>
      </div>
    );
  }

  const downloadPDF = async () => {
    const input = document.getElementById('stamp-paper-area');
    
    // 🔥 Virtual Canvas Logic: मोबाइल पर टेक्स्ट कटने से रोकने के लिए
    const originalWidth = input.style.width;
    input.style.width = '800px'; 

    try {
      const canvas = await html2canvas(input, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        allowTaint: true,
        windowWidth: 800 // वर्चुअल विंडो विड्थ ताकि मोबाइल पर रेंडरिंग न फटे
      });

      input.style.width = originalWidth; // वापस ओरिजिनल विड्थ पर लाएं

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Agreement_${tenant.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      input.style.width = originalWidth;
      alert("Download failed. Please try again.");
    }
  };

  return (
    <div className="contract-container">
      <div className="action-bar">
        <button onClick={downloadPDF} className="download-btn">
          Download & Save Agreement
        </button>
      </div>

      <div id="stamp-paper-area" className="stamp-paper">
        <div className="content-overlay">
          <h1 className="contract-title">RENTAL AGREEMENT</h1>
          
          <div className="contract-body">
            <div className="info-row"><span className="label">Tenant Name:</span><span className="value">{tenant.name}</span></div>
            <div className="info-row"><span className="label">Father's Name:</span><span className="value">{tenant.fatherName}</span></div>
            <div className="info-row"><span className="label">Address:</span><span className="value">{tenant.address}</span></div>
            <div className="info-row"><span className="label">Mobile No:</span><span className="value">{tenant.mobile}</span></div>
            {tenant.aadhaar && (
              <div className="info-row"><span className="label">Aadhaar No:</span><span className="value">{tenant.aadhaar}</span></div>
            )}
            
            <hr className="divider" />
            
            <div className="info-row"><span className="label">Property:</span><span className="value">{agreement.propertyName}</span></div>
            <div className="info-row"><span className="label">Monthly Rent:</span><span className="value">₹{agreement.rentAmount}/-</span></div>

            <div className="terms-section">
              <h3>Terms and Conditions:</h3>
              <ol>
                {Array.isArray(agreement.terms) ? agreement.terms.map((term, index) => (
                  <li key={index}>{term}</li>
                )) : <li>{agreement.terms}</li>}
              </ol>
            </div>
          </div>

          <div className="signatures">
            <div className="sign-box">
              <p className="declaration">I accept all terms & conditions.</p>
              {tenant.signature ? (
                <img src={tenant.signature} alt="Tenant Sign" className="sign-img" />
              ) : <div className="placeholder-sign">Signed</div>}
              <p className="sign-label">Tenant Signature</p>
            </div>
            
            <div className="sign-box owner">
              {agreement.ownerSignature ? (
                <img src={agreement.ownerSignature} alt="Owner Sign" className="sign-img" />
              ) : <div className="placeholder-sign owner-placeholder">Not Signed</div>}
              <p className="sign-label">Owner Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}