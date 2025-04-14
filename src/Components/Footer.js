import React from 'react';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Skill's Sync</h3>
          <p>Unlock your potential with AI-driven career guidance.</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/profile">Profile</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Connect With Us</h3>
          <div className="social-links">
            <a href="#" className="social-link"><FaGithub /></a>
            <a href="#" className="social-link"><FaLinkedin /></a>
            <a href="#" className="social-link"><FaTwitter /></a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Skill's Sync. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 