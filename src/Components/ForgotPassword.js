"use client"

import { useState } from "react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "../firebase"
import { FaEnvelope } from "react-icons/fa"
import "./ForgotPassword.css"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setMessage("")
    setError("")

    try {
      await sendPasswordResetEmail(auth, email)
      setMessage("Password reset email sent. Check your inbox.")
    } catch (error) {
      setError("Error sending password reset email. Please try again.")
      console.error("Error:", error)
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <h2>Forgot Password</h2>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleResetPassword}>
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
            Reset Password
          </button>
        </form>
        <p className="login-link">
          Remember your password? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword

