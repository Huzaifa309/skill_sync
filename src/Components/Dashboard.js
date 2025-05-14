import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import './Dashboard.css';
import { FaChartLine, FaRobot, FaUserGraduate, FaCog, FaCommentDots, FaPlus, FaTimes, FaSpinner } from 'react-icons/fa';
import SkillSelection from './SkillSelection';
import ProfileManagement from './Profile';
import Chatbot from './Chatbot';
import PredictArima from './predict_arima';
import PredictNBeats from './predict_nbeats';
import { ThemeContext } from '../context/ThemeContext';
import arrowImg from '../assets/images/arrowimg.png';

const CAREER_LABELS = {
  ".netdeveloper": ".NET Developer",
  ".netsqldeveloper": ".NET SQL Developer",
  "ai": "AI Specialist",
  "aiengineer": "AI Engineer",
  "aimlengineer": "AI/ML Engineer",
  "airesearcher": "AI Researcher",
  "applicationsecurity": "Application Security Specialist",
  "azuredevopsengineer": "Azure DevOps Engineer",
  "c++programmer": "C++ Programmer",
  "crmspecialist": "CRM Specialist",
  "cybersecurityconsultant": "Cybersecurity Consultant",
  "cybersecurityengineer": "Cybersecurity Engineer",
  "cybersecurityoperationsengineer": "Cybersecurity Operations Engineer",
  "cybersecurityspecialist": "Cybersecurity Specialist",
  "datascience": "Data Science Specialist",
  "datascientist": "Data Scientist",
  "devopsengineer": "DevOps Engineer",
  "digitaldesigner": "Digital Designer",
  "embeddedsystemsprogrammer": "Embedded Systems Programmer",
  "erplaraveldeveloper": "ERP Laravel Developer",
  "fluttermobiledeveloper": "Flutter Mobile Developer",
  "frontenddevelopers": "Frontend Developer",
  "fullstackdeveloperjavacripttypescript": "Full Stack Developer (JavaScript/TypeScript)",
  "fullstackengineerpython": "Full Stack Engineer (Python)",
  "gameprogrammer": "Game Programmer",
  "graphicdesigner": "Graphic Designer",
  "iosdeveloper": "iOS Developer",
  "mobileappdeveloper": "Mobile App Developer",
  "networkadministrator": "Network Administrator",
  "networkoperationengineer": "Network Operation Engineer",
  "securityoperationscenteranalyst": "Security Operations Center Analyst",
  "softwareengineer": "Software Engineer",
  "unity3dprogrammer": "Unity 3D Programmer",
  "unityar": "Unity AR Developer",
  "unrealenginedeveloper": "Unreal Engine Developer",
  "visualdesigner": "Visual Designer",
  "webdeveloper": "Web Developer"
};

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
  const [showAddSkillTooltip, setShowAddSkillTooltip] = useState(true);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [recommendedCareers, setRecommendedCareers] = useState([]);
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
    !selectedSkills.includes(skill) &&
    !skillsToAcquire.includes(skill)
  );

  const handleAddSkill = (skill) => {
    if (!selectedSkills.includes(skill) && !skillsToAcquire.includes(skill)) {
      const newSelectedSkills = [...selectedSkills, skill];
      console.log('Skills after adding:', {
        selectedSkills: newSelectedSkills,
        skillsToAcquire: skillsToAcquire
      });
      setSelectedSkills(newSelectedSkills);
      setSearchTerm('');
      setShowSkillsDropdown(false);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const newSelectedSkills = selectedSkills.filter(skill => skill !== skillToRemove);
    const newSkillsToAcquire = skillsToAcquire.filter(skill => skill !== skillToRemove);
    console.log('Skills after removing:', {
      selectedSkills: newSelectedSkills,
      skillsToAcquire: newSkillsToAcquire
    });
    setSelectedSkills(newSelectedSkills);
    setSkillsToAcquire(newSkillsToAcquire);
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

  const handleToggleSkills = async () => {
    if (!skillsLoaded) {
      await handleLoadSkills();
      setShowAddSkillTooltip(true);
    } else {
      setSkillsLoaded(false);
      setSelectedSkills([]);
      setSkillsToAcquire([]);
    }
  };

  // Timer for the "Add Skill" tooltip
  useEffect(() => {
    let tooltipTimer;
    if (skillsLoaded && showAddSkillTooltip && !showSkillsDropdown && !showChatbot) {
      tooltipTimer = setTimeout(() => {
        setShowAddSkillTooltip(false);
      }, 5000); // 5 seconds
    }
    return () => clearTimeout(tooltipTimer); // Cleanup timer
  }, [skillsLoaded, showAddSkillTooltip, showSkillsDropdown, showChatbot]);

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

  const handleGetCareerRecommendation = async () => {
    setIsLoadingRecommendation(true);
    const combinedSkills = [...selectedSkills, ...skillsToAcquire];
    const uniqueCombinedSkills = [...new Set(combinedSkills)];
  
    if (uniqueCombinedSkills.length === 0) {
      console.log('No skills to send.');
      setIsLoadingRecommendation(false);
      return;
    }
  
    try {
      const response = await fetch('/predict-careers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ allUserSkills: uniqueCombinedSkills })
      });
  
      if (!response.ok) throw new Error('Career prediction API error');
  
      const result = await response.json();
      console.log('🎯 Career Recommendations:', result);
  
      // Show top 5 with scores from all_predictions
      const topCareers = result.all_predictions ? result.all_predictions.slice(0, 5) : [];
      setRecommendedCareers(topCareers.map(([career]) => CAREER_LABELS[career] || career));
      setShowCareerModal(true);
    } catch (err) {
      console.error('Career prediction failed:', err);
      // Optionally show an error modal or message
    } finally {
      setIsLoadingRecommendation(false);
    }
  };
  
  

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
            {/* Skills block: only show when skillsLoaded is true */}
            {skillsLoaded && (
              (() => {
                const allSkills = [
                  ...selectedSkills.map(skill => ({ skill, type: 'current' })),
                  ...skillsToAcquire.map(skill => ({ skill, type: 'acquire' }))
                ];
                const rows = [];
                for (let i = 0; i < allSkills.length; i += 5) {
                  rows.push(allSkills.slice(i, i + 5));
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px', position: 'relative' }}>
                    {rows.map((row, rowIdx) => (
                      <div key={rowIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {row.map(({ skill, type }) => (
                          <div
                            key={skill}
                            style={type === 'current' ? {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: isDarkMode ? '#444' : '#f0f0f0',
                              padding: '5px 10px',
                              borderRadius: '15px',
                              color: isDarkMode ? 'white' : 'black',
                              fontWeight: 500
                            } : {
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
                              style={type === 'current' ? {
                                background: 'none',
                                border: 'none',
                                color: isDarkMode ? 'white' : 'black',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              } : {
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
                      </div>
                    ))}
                    {/* + button and dropdown in a relatively positioned container */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
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
                            const target = e.currentTarget;
                            target.style.background = isDarkMode ? '#333' : '#e6f0ff';
                            target.style.borderColor = '#0056b3';
                          }}
                          onMouseOut={e => {
                            const target = e.currentTarget;
                            target.style.background = 'transparent';
                            target.style.borderColor = '#007BFF';
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
                                width: 'calc(100% - 16px)',
                                padding: '8px',
                                marginBottom: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                boxSizing: 'border-box'
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
                                    borderRadius: '4px'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.backgroundColor = isDarkMode ? '#444' : '#f0f0f0'}
                                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  {skill}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Arrow and tooltip, absolutely positioned to the right of the + button, vertically centered */}
                        {!showSkillsDropdown && !showChatbot && showAddSkillTooltip && (
                          <div style={{
                            position: 'absolute',
                            left: 'calc(100% + 10px)', // Ensure space from button
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
                              marginLeft: '8px',
                              fontWeight: 'bold'
                            }}>
                              {'You can add\nor remove more\nskills here!'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
            {/* The toggle button is always visible */}
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
              onClick={handleToggleSkills}
            >
              {skillsLoaded ? 'Close Skills' : 'Load all your skills (current & to acquire)'}
            </button>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              {isLoadingRecommendation ? (
                <div style={{ minWidth: 60, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaSpinner className="fa-spin" size={32} color="#28a745" />
                </div>
              ) : (
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
                  onClick={handleGetCareerRecommendation}
                >
                  Get Career Recommendation
                </button>
              )}
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

      {showCareerModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '32px 24px 24px 24px',
            minWidth: '320px',
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            position: 'relative',
            color: 'black'
          }}>
            <button
              onClick={() => setShowCareerModal(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#888'
              }}
              aria-label="Close"
            >×</button>
            <h2 style={{marginTop: 0, marginBottom: 16, color: 'black'}}>Recommender Says:</h2>
            <ul style={{paddingLeft: 0, listStyle: 'none', margin: 0}}>
              {recommendedCareers.map((career, idx) => {
                let color = 'black';
                if (idx === 0) color = 'red';
                else if (idx === 1) color = 'green';
                else if (idx === 2) color = 'blue';
                return (
                  <li key={career} style={{marginBottom: 8, fontSize: '1.1rem', fontWeight: 500, color}}>
                    - {career}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;