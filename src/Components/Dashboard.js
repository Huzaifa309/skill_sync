import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import './Dashboard.css';
import { FaChartLine, FaRobot, FaUserGraduate, FaCog, FaCommentDots, FaPlus, FaTimes } from 'react-icons/fa';
import SkillSelection from './SkillSelection';
import ProfileManagement from './Profile';
import Chatbot from './Chatbot';
import PredictArima from './predict_arima';
import PredictNBeats from './predict_nbeats';
import { ThemeContext } from '../context/ThemeContext';
import arrowImg from '../assets/images/arrowimg.png';

const Dashboard = () => {
  const [userName, setUserName] = useState('User');
  const [activeTab, setActiveTab] = useState('overview');
  const [showChatbot, setShowChatbot] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillsToAcquire, setSkillsToAcquire] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatbotPrompt, setShowChatbotPrompt] = useState(true);
  const [promptIndex, setPromptIndex] = useState(0);
  const [skillsLoaded, setSkillsLoaded] = useState(false);
  const chatbotPrompts = [
    '💬 Need guidance? Try our Career Counselor for personalized advice!',
    '🤖 Unsure about your next step? Ask the AI Career Counselor!',
    '🎯 Get personalized career recommendations instantly with our chatbot!',
    '📈 Want to learn more? The Career Counselor can help!',
    '🧭 Not sure which skill to learn next? Get expert suggestions!'
  ];
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const plusButtonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }
      const userId = auth.currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserName(userData.name || 'User');
        setUserDetails({
          name: userData.name || '',
          contactNumber: userData.contactNumber || '',
          dateOfBirth: userData.dateOfBirth || '',
          location: userData.location || '',
          university: userData.university || '',
          degree: userData.degree || '',
          yearOfStudy: userData.yearOfStudy || '',
          educationalInterests: userData.educationalInterests || '',
          skills: userData.skills || '',
          skillsToAcquire: userData.skillsToAcquire || '',
          careerGoals: userData.careerGoals || '',
          hobbies: userData.hobbies || '',
          learningStyle: userData.learningStyle || '',
          languages: userData.languages || ''
        });
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    // Fetch skills from skills.txt
    fetch('/skills.txt')
      .then(response => response.text())
      .then(text => {
        const skills = text.split('\n').map(skill => skill.trim()).filter(skill => skill.length > 0);
        setAvailableSkills(skills);
      })
      .catch(error => console.error('Error loading skills:', error));
  }, []);

  useEffect(() => {
    if (!showChatbotPrompt) return;
    const interval = setInterval(() => {
      setPromptIndex(prev => (prev + 1) % chatbotPrompts.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [showChatbotPrompt]);

  const filteredSkills = availableSkills.filter(skill => 
    skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedSkills.includes(skill)
  );

  const handleAddSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setSearchTerm('');
      setShowSkillsDropdown(false);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  useEffect(() => {
    if (!showChatbot && !showChatbotPrompt) {
      // When chatbot is closed and popup is hidden, show popup after 20 seconds
      const timer = setTimeout(() => {
        setShowChatbotPrompt(true);
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [showChatbot, showChatbotPrompt]);

  const handleLoadSkills = async () => {
    console.log('handleLoadSkills called');
    if (!auth.currentUser) {
      console.log('No current user found');
      return;
    }
    try {
      console.log('Fetching user document for:', auth.currentUser.uid);
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      console.log('User data:', userData);
      
      let currentSkills = [];
      let toAcquireSkills = [];
      
      // Add current skills from user profile
      if (userData && userData.skills) {
        console.log('Current skills:', userData.skills);
        
        // Handle different data types for skills
        if (typeof userData.skills === 'string') {
          currentSkills = userData.skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
        } else if (Array.isArray(userData.skills)) {
          currentSkills = userData.skills;
        } else if (typeof userData.skills === 'object') {
          currentSkills = Object.values(userData.skills);
        }
      }
      
      // Add skills to acquire if they exist
      if (userData && userData.skillsToAcquire) {
        console.log('Skills to acquire:', userData.skillsToAcquire);
        
        // Handle different data types for skillsToAcquire
        if (typeof userData.skillsToAcquire === 'string') {
          toAcquireSkills = userData.skillsToAcquire.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
        } else if (Array.isArray(userData.skillsToAcquire)) {
          toAcquireSkills = userData.skillsToAcquire;
        } else if (typeof userData.skillsToAcquire === 'object') {
          toAcquireSkills = Object.values(userData.skillsToAcquire);
        }
      }
      
      // Ensure all skills are unique and sorted
      currentSkills = [...new Set(currentSkills)].sort();
      toAcquireSkills = [...new Set(toAcquireSkills)].sort();
      
      console.log('Current skills:', currentSkills);
      console.log('Skills to acquire:', toAcquireSkills);
      
      setSelectedSkills(currentSkills);
      setSkillsToAcquire(toAcquireSkills);
      setSkillsLoaded(true);
    } catch (error) {
      console.error('Error loading skills:', error);
      setSelectedSkills([]);
      setSkillsToAcquire([]);
      setSkillsLoaded(true);
    }
  };

  // Hide dropdown when clicking outside of dropdown or + button
  useEffect(() => {
    if (showSkillsDropdown) {
      const handleClick = (e) => {
        if (
          plusButtonRef.current &&
          !plusButtonRef.current.contains(e.target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target)
        ) {
          setShowSkillsDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showSkillsDropdown]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '80vh',
            gap: '20px'
          }}>
            {!skillsLoaded ? (
              <button
                style={{
                  padding: '15px 30px',
                  fontSize: '1.1rem',
                  backgroundColor: '#007BFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  fontWeight: 500
                }}
                onClick={handleLoadSkills}
              >
                Load all your skills (current & to acquire)
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '30px', position: 'relative' }}>
                {selectedSkills.map((skill) => (
                  <div
                    key={skill}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: isDarkMode ? '#444' : '#f0f0f0',
                      padding: '5px 10px',
                      borderRadius: '15px',
                      color: isDarkMode ? 'white' : 'black',
                      fontWeight: 500
                    }}
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isDarkMode ? 'white' : 'black',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
                {skillsToAcquire.map((skill) => (
                  <div
                    key={skill}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: isDarkMode ? '#2c5282' : '#e6f3ff',
                      padding: '5px 10px',
                      borderRadius: '15px',
                      color: isDarkMode ? 'white' : '#2c5282',
                      fontWeight: 500,
                      border: '1px dashed #4299e1'
                    }}
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isDarkMode ? 'white' : '#2c5282',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
                {/* + button and dropdown in a relatively positioned container */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button
                      ref={plusButtonRef}
                      onClick={() => setShowSkillsDropdown(!showSkillsDropdown)}
                      style={{
                        background: 'transparent',
                        border: '2px solid #007BFF',
                        color: isDarkMode ? 'white' : 'black',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        padding: '5px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                        transition: 'all 0.2s',
                        marginLeft: '5px',
                      }}
                      onMouseOver={e => {
                        e.target.style.background = isDarkMode ? '#333' : '#e6f0ff';
                        e.target.style.borderColor = '#0056b3';
                      }}
                      onMouseOut={e => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderColor = '#007BFF';
                      }}
                      aria-label="Add skill"
                    >
                      <FaPlus />
                    </button>
                    {/* Skills dropdown, absolutely positioned below the + button */}
                    {showSkillsDropdown && (
                      <div
                        ref={dropdownRef}
                        style={{
                          position: 'absolute',
                          top: '120%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: isDarkMode ? '#333' : 'white',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          padding: '10px',
                          zIndex: 1000,
                          width: '300px',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}
                      >
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search skills..."
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginBottom: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {filteredSkills.map(skill => (
                            <button
                              key={skill}
                              onClick={() => handleAddSkill(skill)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                color: isDarkMode ? 'white' : 'black',
                                ':hover': {
                                  backgroundColor: isDarkMode ? '#444' : '#f0f0f0'
                                }
                              }}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Arrow and tooltip, absolutely positioned to the right of the + button, vertically centered */}
                    {!showSkillsDropdown && !showChatbot && (
                      <div style={{
                        position: 'absolute',
                        left: '110%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        zIndex: 1100
                      }}>
                        <img
                          src={arrowImg}
                          alt="arrow"
                          style={{
                            width: '38px',
                            height: '38px',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                        <div style={{
                          background: isDarkMode ? '#232323' : '#fff',
                          color: isDarkMode ? 'white' : 'black',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.13)',
                          padding: '8px 16px',
                          fontSize: '0.95rem',
                          whiteSpace: 'pre-line',
                          border: isDarkMode ? '1px solid #444' : '1px solid #e0e0e0',
                          textAlign: 'left',
                          lineHeight: 1.4,
                          marginLeft: '8px'
                        }}>
                          {['You can add or', 'remove more skills', 'here!'].map((line, idx) => (
                            <span key={idx}>{line}<br /></span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button 
                style={{
                  padding: '15px 30px',
                  fontSize: '1.1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  minWidth: '320px',
                  fontWeight: 500
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
              >
                Get Career Recommendation
              </button>
            </div>
          </div>
        );
      case 'skills':
        return <SkillSelection />;
      case 'profile':
        return <ProfileManagement />;
      case 'predict':
        return <PredictArima />;
      case 'predict-advanced':
        return <PredictNBeats />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-page">
      <nav className="dashboard-header">
        <div className="logo">Skill's Sync</div>
        <div className="dashboard-nav">
          <button
            onClick={() => setActiveTab('overview')}
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('predict')}
            className={`nav-tab ${activeTab === 'predict' ? 'active' : ''}`}
          >
            Predict Skills (Quick)
          </button>
          <button
            onClick={() => setActiveTab('predict-advanced')}
            className={`nav-tab ${activeTab === 'predict-advanced' ? 'active' : ''}`}
          >
            Predict Skills (Advanced)
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`nav-tab ${activeTab === 'skills' ? 'active' : ''}`}
          >
            Learn New Skills
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <FaCog className="nav-icon" /> Profile Management
          </button>
        </div>
        <div className="header-right">
          <span>Hello, {userName}</span>
          <button onClick={handleLogout} className="logout-btn">
            LOG OUT
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        {renderTabContent()}
      </main>

      {/* Chatbot Prompt Popup and Button Row */}
      <div
        style={{
          position: 'fixed',
          right: '32px',
          bottom: '32px',
          zIndex: 1201,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Prompt and arrow absolutely positioned to the left of chat button */}
        {showChatbotPrompt && (
          <>
            <div
              style={{
                position: 'absolute',
                right: '90px', // width of arrow + button + margin
                top: '50%',
                transform: 'translateY(-50%)',
                background: isDarkMode ? '#232323' : '#fff',
                color: isDarkMode ? 'white' : 'black',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                padding: '18px 24px 18px 18px',
                minWidth: '260px',
                maxWidth: '320px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1rem',
                border: isDarkMode ? '1px solid #444' : '1px solid #e0e0e0',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ flex: 1 }}>
                {chatbotPrompts[promptIndex]}
              </span>
              <button
                onClick={() => setShowChatbotPrompt(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDarkMode ? '#fff' : '#333',
                  fontSize: '1.2rem',
                  marginLeft: '10px',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1
                }}
                aria-label="Close prompt"
              >
                ×
              </button>
            </div>
            <img
              src={arrowImg}
              alt="arrow"
              style={{
                width: '38px',
                height: '38px',
                objectFit: 'contain',
                display: 'block',
                marginRight: '8px',
                marginLeft: '8px',
              }}
            />
          </>
        )}
        {/* Only show chat button when chatbot is closed */}
        {!showChatbot && (
          <button 
            className="chat-button" 
            onClick={() => {
              setShowChatbotPrompt(false);
              setShowChatbot(!showChatbot);
            }}
            style={{
              position: 'static',
              zIndex: 1201
            }}
          >
            <FaCommentDots />
          </button>
        )}
      </div>

      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} userDetails={userDetails} />}
    </div>
  );
};

export default Dashboard;