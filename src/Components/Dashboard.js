import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Dashboard.css';
import { FaChartLine, FaRobot, FaUserGraduate, FaCog, FaCommentDots } from 'react-icons/fa';
import SkillSelection from './SkillSelection';
import ProfileManagement from './Profile';
import Chatbot from './Chatbot';

const Dashboard = () => {
  const [userName, setUserName] = useState('User');
  const [activeTab, setActiveTab] = useState('overview');
  const [showChatbot, setShowChatbot] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="hero-section">
            <div className="welcome-card">
              <h1>Welcome to Skill's Sync, {userName}!</h1>
              <p>Unlock your innate potential with AI-driven insights according to your skills and goals.</p>
            </div>
            <div className="features">
              <div className="feature-card">
                <FaChartLine className="feature-icon" />
                <h3>Career Growth</h3>
                <p>Grow your skills and advance your career.</p>
              </div>
              <div className="feature-card">
                <FaRobot className="feature-icon" />
                <h3>AI Insights</h3>
                <p>Personalized recommendations powered by AI.</p>
              </div>
              <div className="feature-card">
                <FaUserGraduate className="feature-icon" />
                <h3>Skill Enhancement</h3>
                <p>Get the support you need to succeed.</p>
              </div>
            </div>
          </div>
        );
      case 'skills':
        return <SkillSelection />;
      case 'profile':
        return <ProfileManagement />;
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
            onClick={() => setActiveTab('skills')}
            className={`nav-tab ${activeTab === 'skills' ? 'active' : ''}`}
          >
            Skills
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <FaCog className="nav-icon" /> Profile
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

      <button 
        className="chat-button" 
        onClick={() => setShowChatbot(!showChatbot)}
      >
        <FaCommentDots />
      </button>

      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} userDetails={userDetails} />}
    </div>
  );
};

export default Dashboard;