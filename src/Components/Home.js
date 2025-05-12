import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaUserPlus, FaRocket, FaChartLine, FaComments, FaGraduationCap } from 'react-icons/fa';
import './Home.css';
import Footer from "./Footer"

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="logo">Skill's Sync</div>
        <div className="nav-buttons">
          <button className="nav-btn login-btn" onClick={() => navigate('/login')}>
            <FaUser /> Login
          </button>
          <button className="nav-btn signup-btn" onClick={() => navigate('/signup')}>
            <FaUserPlus /> Sign Up
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Your AI-Powered Career Counselor</h1>
          <p className="hero-subtitle">
            Discover your career path, enhance your skills, and achieve your professional goals with personalized AI guidance.
          </p>
          <div className="hero-buttons">
            <button className="cta-button primary large" onClick={() => navigate('/signup')}>
              <FaRocket /> Get Started
          </button>
            <button className="cta-button secondary large" onClick={() => navigate('/login')}>
              <FaUser /> Login
          </button>
        </div>
      </div>
      </section>

      <section className="features-section">
        <h2>Why Choose Skill's Sync?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FaChartLine />
            </div>
            <h3>Personalized Career Path</h3>
            <p>Get tailored career recommendations based on your skills, interests, and goals.</p>
          </div>
        <div className="feature-card">
            <div className="feature-icon">
              <FaGraduationCap />
            </div>
            <h3>Skill Development</h3>
            <p>Access curated learning resources and track your progress towards career goals.</p>
        </div>
        <div className="feature-card">
            <div className="feature-icon">
              <FaComments />
            </div>
            <h3>AI Career Guidance</h3>
            <p>Get instant answers to your career questions from our AI-powered counselor.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon">
              <FaUserPlus />
            </div>
            <h3>Create Your Profile</h3>
            <p>Sign up and tell us about your skills, experience, and career aspirations.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon">
              <FaChartLine />
            </div>
            <h3>Get Career Insights</h3>
            <p>Receive personalized career recommendations and skill development paths.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon">
              <FaRocket />
            </div>
            <h3>Start Your Journey</h3>
            <p>Begin your career development journey with our AI-powered guidance.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Transform Your Career?</h2>
        <p>Join thousands of professionals who have found their perfect career path with Skill's Sync.</p>
        <div className="hero-buttons">
          <button className="cta-button primary large" onClick={() => navigate('/signup')}>
            <FaRocket /> Start Now
          </button>
      </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;

