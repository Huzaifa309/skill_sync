"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase"
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa"
import "./Login.css"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/dashboard")
    } catch (error) {
      console.error("Error logging in:", error.message)
      setError("Invalid email or password.")
    }
  }

  const handleBackToHome = () => {
    navigate("/")
  }

  return (
    <div className="login-page">
      <button className="back-button" onClick={handleBackToHome}>
        <FaArrowLeft /> Back to Home
      </button>
      <div className="login-card">
        <h2>LOG IN</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="input-field">
            <FaEnvelope className="icon" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-field">
            <FaLock className="icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        <p className="forgot-password-link">
          <a href="/forgot-password">Forgot Password?</a>
        </p>
        <p className="signup-link">
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  )
}

export default Login

