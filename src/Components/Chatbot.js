import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Chatbot = ({ onClose, userDetails }) => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState(() => {
    // Initialize with user-specific messages from localStorage
    const userId = auth.currentUser?.uid;
    const savedMessages = userId ? localStorage.getItem(`chatbotMessages_${userId}`) : null;
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [loading, setLoading] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const messagesEndRef = useRef(null);

  // Maximum number of messages to keep
  const MAX_MESSAGES = 50;

  // Fetch user's skills when component mounts
  useEffect(() => {
    const fetchUserSkills = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userSkillsQuery = query(
          collection(db, "userSkills"),
          where("userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(userSkillsQuery);
        
        if (!querySnapshot.empty) {
          const skillsData = querySnapshot.docs[0].data();
          setUserSkills(skillsData.skills || []);
        }
      } catch (error) {
        console.error("Error fetching user skills:", error);
      }
    };

    fetchUserSkills();
  }, []);

  useEffect(() => {
    if (userDetails && messages.length === 0) {
      const initialMessage = { 
        sender: 'bot', 
        text: `Hello ${userDetails.name}, I am your Virtual Career Counselor! How can I assist you today?`,
        timestamp: new Date().toISOString()
      };
      setMessages([initialMessage]);
      const userId = auth.currentUser?.uid;
      if (userId) {
        localStorage.setItem(`chatbotMessages_${userId}`, JSON.stringify([initialMessage]));
      }
    }
  }, [userDetails, messages.length]);

  useEffect(() => {
    // Save messages to user-specific localStorage whenever they change
    const userId = auth.currentUser?.uid;
    if (userId) {
      localStorage.setItem(`chatbotMessages_${userId}`, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatResponse = (text) => {
    // Remove all ** symbols from the text
    const cleanText = text.replace(/\*\*/g, '');
    
    // Split the text into paragraphs
    const paragraphs = cleanText.split('\n\n');
    
    // Format each paragraph
    return paragraphs.map((paragraph, index) => {
      // Check for bullet points
      if (paragraph.startsWith('* ')) {
        const points = paragraph.split('\n* ');
        return `<ul>${points.map(point => `<li>${point.replace('* ', '')}</li>`).join('')}</ul>`;
      }
      
      // Check for numbered lists
      if (paragraph.match(/^\d+\./)) {
        const points = paragraph.split('\n');
        return `<ol>${points.map(point => `<li>${point.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ol>`;
      }
      
      return `<p>${paragraph}</p>`;
    }).join('');
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage = { 
      sender: 'user', 
      text: userInput,
      timestamp: new Date().toISOString()
    };
    
    const newMessages = [...messages, newMessage].slice(-MAX_MESSAGES);
    setMessages(newMessages);
    setUserInput('');
    setLoading(true);

    try {
      // Create a more detailed context including user skills
      const userContext = {
        ...userDetails,
        skills: userSkills,
        skillsToAcquire: userDetails?.skillsToAcquire || []
      };

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
        {
          "contents": [
            { 
              "parts": [
                { 
                  "text": `User Context: ${JSON.stringify(userContext)}. Current Message: ${userInput}. Please provide career guidance considering the user's current skills and skills they want to acquire.`
                }
              ] 
            }
          ]
        }
      );

      const botResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't understand that.";
      const formattedResponse = formatResponse(botResponse);
      
      const botMessage = {
        sender: 'bot',
        text: formattedResponse,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...newMessages, botMessage].slice(-MAX_MESSAGES);
      setMessages(updatedMessages);
    } catch (error) {
      console.error("Error fetching chatbot response:", error);
      const errorMessage = {
        sender: 'bot',
        text: "Sorry, something went wrong. Please try again later.",
        timestamp: new Date().toISOString()
      };
      const errorMessages = [...newMessages, errorMessage].slice(-MAX_MESSAGES);
      setMessages(errorMessages);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Virtual Career Counselor</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="messages-container">
        {messages.length >= MAX_MESSAGES && (
          <div className="message-limit-warning">
            Message limit reached. Older messages will be removed when new ones are added.
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}-message`}>
            <div 
              className="message-content"
              dangerouslySetInnerHTML={{ __html: msg.text }}
            />
            <div className="message-time">{formatTime(msg.timestamp)}</div>
          </div>
        ))}
        {loading && (
          <div className="loading-indicator">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          className="message-input"
          placeholder="Ask me anything..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button 
          onClick={sendMessage} 
          className="send-button"
          disabled={loading || !userInput.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
