import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Dashboard.css';
import { FaChartLine, FaRobot, FaUserGraduate, FaCog, FaQuestionCircle } from 'react-icons/fa';
import SkillSelection from './SkillSelection';
import ProfileManagement from './Profile';

const Dashboard = () => {
  const [userName, setUserName] = useState('User');
  const [activeTab, setActiveTab] = useState('overview');
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
        setUserName(userDoc.data().name || 'User');
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
          <span>Hello, {userName} </span>
          <button onClick={handleLogout} className="logout-btn">
            LOG OUT
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Dashboard;
