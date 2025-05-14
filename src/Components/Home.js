import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaUserPlus, FaRocket, FaChartLine, FaComments, FaGraduationCap } from 'react-icons/fa';
import Footer from "./Footer";
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Navigation Bar */}
      <header>
        <nav className="navbar" aria-label="Main Navigation">
          <div className="logo">Skill's Sync</div>
          <div className="nav-buttons">
            <button className="nav-btn login-btn" onClick={() => navigate('/login')} aria-label="Login">
              <FaUser /> Login
            </button>
            <button className="nav-btn signup-btn" onClick={() => navigate('/signup')} aria-label="Sign Up">
              <FaUserPlus /> Sign Up
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="hero-section" aria-label="Hero">
          <div className="hero-content">
            <h1>Your AI-Powered Career Counselor</h1>
            <p className="hero-subtitle">
              Discover your career path, enhance your skills, and achieve your professional goals with personalized AI guidance.
            </p>
            <div className="hero-buttons">
              <button className="cta-button primary large" onClick={() => navigate('/signup')} aria-label="Get Started">
                <FaRocket /> Get Started
              </button>
              <button className="cta-button secondary large" onClick={() => navigate('/login')} aria-label="Login">
                <FaUser /> Login
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section" aria-label="Features">
          <h2>Why Choose Skill's Sync?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaChartLine />
              </div>
              <h3>Skill Growth Analysis</h3>
              <p>Get skill growth analysis based on your current skills.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaGraduationCap />
              </div>
              <h3>Skill Development</h3>
              <p>Access learning resources from different platform and make progress towards learning new skills.</p>
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

        {/* How It Works Section */}
        <section className="how-it-works" aria-label="How It Works">
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

        {/* Call to Action Section */}
        <section className="cta-section" aria-label="Call to Action">
          <h2>Ready to Transform Your Career?</h2>
          <p>Start your journey for a better career with Skill's Sync.</p>
          <div className="hero-buttons">
            <button className="cta-button primary large" onClick={() => navigate('/signup')} aria-label="Start Now">
              <FaRocket /> Start Now
            </button>
          </div>
        </section>
      </main>

      {/* Theme Toggle (if you have one, place it here or in the nav/footer) */}
      {/* <ThemeToggle /> */}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
