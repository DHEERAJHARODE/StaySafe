import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots } from 'react-icons/fa';
import './AIAssistant.css';

// .env se API Key fetch kar rahe hain
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// API initialize kar rahe hain (agar key hai tabhi)
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Namaste! Main aapka AI Assistant hu. Main aapko pages par le ja sakta hu ya service request raise karne me madad kar sakta hu.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const chatBodyRef = useRef(null);

  // Naya message aane par auto-scroll down karne ke liye
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // CHECK 1: Agar API key set nahi hai toh error message dikhaye
    if (!apiKey) {
      setMessages((prev) => [...prev, { 
        text: "Error: VITE_GEMINI_API_KEY nahi mili. Kripya apni .env file check karein aur server (npm run dev) restart karein.", 
        sender: 'bot' 
      }]);
      return;
    }

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setIsLoading(true);

    try {
      // ✅ Naya aur stable tarika AI ko define karne ka
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", // Ye stable hai latest version me
        generationConfig: {
          responseMimeType: "application/json",
          // Schema define karne se AI hamesha yahi format dega, fail nahi hoga
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              action: {
                type: SchemaType.STRING,
                description: "Must be one of: CHAT, REDIRECT, RAISE_REQUEST",
              },
              route: {
                type: SchemaType.STRING,
                description: "The React route to navigate to (e.g. /contact, /login, /dashboard). Return empty string if not REDIRECT.",
              },
              details: {
                type: SchemaType.OBJECT,
                properties: {
                  issue: { type: SchemaType.STRING },
                  room: { type: SchemaType.STRING }
                },
                description: "Details of the service request. Return empty object if not RAISE_REQUEST."
              },
              message: {
                type: SchemaType.STRING,
                description: "The reply message to the user in Hinglish/Hindi."
              }
            },
            required: ["action", "route", "details", "message"]
          }
        }
      });
      
      const systemPrompt = `
        You are a smart AI Assistant for a room rental platform.
        You must help users, navigate them, or take service requests.
        
        Available Routes in the React app:
        - Home: /
        - Login: /login
        - Register: /register
        - Dashboard: /dashboard
        - All Rooms: /rooms
        - My Rooms: /my-rooms
        - Add Room: /add-room
        - Inbox / Chat: /inbox
        - Profile: /profile
        - Booking Requests: /booking-requests
        - My Requests: /my-requests
        - Contact Us: /contact

        Rules:
        1. If user asks to go to a page, return action="REDIRECT" with the correct route.
        2. If user mentions a problem (e.g., 'AC is not working'), ask for details if missing. When complete, return action="RAISE_REQUEST".
        3. For normal conversation (e.g., 'hey', 'hello', 'who are you'), use action="CHAT".
      `;

      const chatHistory = messages.map(m => `${m.sender}: ${m.text}`).join("\n");
      const fullPrompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\nUser: ${userMessage}`;
      
      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();
      
      // Ab ye securely parse ho jayega
      const aiResponse = JSON.parse(responseText);

      // AI ke 'action' ke hisaab se react karna
      if (aiResponse.action === 'CHAT') {
        setMessages((prev) => [...prev, { text: aiResponse.message, sender: 'bot' }]);
      } 
      else if (aiResponse.action === 'REDIRECT') {
        setMessages((prev) => [...prev, { text: aiResponse.message, sender: 'bot' }]);
        setTimeout(() => {
          // Check ki kahi AI ne galti se route me kuch aur to nahi bheja
          if (aiResponse.route && aiResponse.route.startsWith('/')) {
             navigate(aiResponse.route);
          }
          setIsOpen(false); 
        }, 1500); 
      } 
      else if (aiResponse.action === 'RAISE_REQUEST') {
        setMessages((prev) => [...prev, { text: `✅ ${aiResponse.message}`, sender: 'bot' }]);
      }

    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages((prev) => [...prev, { text: "Network error aayi hai. Kripya apna Browser Console (F12) check karein detailed error ke liye.", sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-widget-container">
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaRobot size={22} /> AI Support
            </span>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>
          
          {/* Messages Body */}
          <div className="ai-chat-body" ref={chatBodyRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`ai-message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && <div className="ai-typing">AI type kar raha hai...</div>}
          </div>

          {/* Input Section */}
          <div className="ai-chat-footer">
            <input 
              type="text" 
              className="ai-chat-input" 
              placeholder="Message type karein..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button className="ai-send-btn" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING BUTTON */}
      {!isOpen && (
        <button className="ai-chat-button" onClick={() => setIsOpen(true)}>
          <FaCommentDots />
        </button>
      )}
    </div>
  );
};

export default AIAssistant;