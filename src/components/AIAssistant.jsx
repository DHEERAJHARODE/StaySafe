import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots } from 'react-icons/fa';
import './AIAssistant.css';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Default pehla message English me set kiya gaya hai
  const [messages, setMessages] = useState([
    { 
      text: "Hello! I am your AI Assistant. I can help you navigate pages or raise a service request. How can I help you today?", 
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const chatBodyRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
      setMessages((prev) => [...prev, { 
        text: "Error: VITE_GEMINI_API_KEY is missing.", 
        sender: 'bot' 
      }]);
      return;
    }

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              action: {
                type: SchemaType.STRING,
                description: "Must be one of: CHAT, REDIRECT, RAISE_REQUEST",
              },
              route: {
                type: SchemaType.STRING,
                description: "The React route to navigate to. Return empty string if not REDIRECT.",
              },
              details: {
                type: SchemaType.OBJECT,
                properties: {
                  issue: { type: SchemaType.STRING },
                  room: { type: SchemaType.STRING }
                }
              },
              message: {
                type: SchemaType.STRING,
                // AI ko schema me bhi bata diya ki same language use karni hai
                description: "The reply message to the user, strictly written in the exact same language (e.g., English, Hindi, or Hinglish) that the user used in their last message." 
              }
            },
            required: ["action", "route", "details", "message"]
          }
        }
      });
      
      const systemPrompt = `
        You are a smart AI Assistant for a room rental platform.
        You must help users, navigate them, or take service requests.
        
        Available Routes:
        - Home: /
        - Login: /login
        - Register: /register
        - Dashboard: /dashboard
        - All Rooms: /rooms
        - My Rooms: /my-rooms
        - Add Room: /add-room
        - Inbox: /inbox
        - Profile: /profile
        - Booking Requests: /booking-requests
        - My Requests: /my-requests
        - Contact Us: /contact

        Rules:
        1. If user asks to go to a page, return action="REDIRECT" with the correct route.
        2. If user mentions a problem, ask for details. When complete, return action="RAISE_REQUEST".
        3. For normal conversation, use action="CHAT".
        4. CRITICAL RULE: Automatically detect the language of the User's message. You MUST reply in that EXACT SAME language (English, Hindi script, or Hinglish).
      `;

      const chatHistory = messages.map(m => `${m.sender}: ${m.text}`).join("\n");
      const fullPrompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\nUser: ${userMessage}`;
      
      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();
      const aiResponse = JSON.parse(responseText);

      if (aiResponse.action === 'CHAT') {
        setMessages((prev) => [...prev, { text: aiResponse.message, sender: 'bot' }]);
      } 
      else if (aiResponse.action === 'REDIRECT') {
        setMessages((prev) => [...prev, { text: aiResponse.message, sender: 'bot' }]);
        setTimeout(() => {
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
      setMessages((prev) => [...prev, { text: "Network error. Please try again.", sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-widget-container">
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaRobot size={22} /> AI Support
            </span>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>
          
          <div className="ai-chat-body" ref={chatBodyRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`ai-message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && <div className="ai-typing">AI is typing...</div>}
          </div>

          <div className="ai-chat-footer">
            <input 
              type="text" 
              className="ai-chat-input" 
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button 
              className="ai-send-btn" 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button className="ai-chat-button" onClick={() => setIsOpen(true)}>
          <FaCommentDots />
        </button>
      )}
    </div>
  );
};

export default AIAssistant;