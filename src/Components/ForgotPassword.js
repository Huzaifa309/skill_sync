"use client"

import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent! Please check your inbox.');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email address.');
      } else {
        setErrorMessage('Failed to send reset email. Please try again.');
      }
    }
  };

  return (
    <div className="forgot-password-page">
      <button className="back-button" onClick={() => navigate('/login')}>
        <FaArrowLeft /> Back to Login
      </button>
      <div className="forgot-password-card">
        <h2>Reset Password</h2>
        {successMessage && <div className="success-message">{successMessage}</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <form onSubmit={handlePasswordReset}>
          <div className="input-field">
            <FaEnvelope className="icon" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="reset-button">
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

