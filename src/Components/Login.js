"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  FaEnvelope,
  FaLock,
  FaArrowLeft,
  FaSpinner
} from "react-icons/fa";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authState, setAuthState] = useState("checking"); // 'checking', 'authenticated', 'unauthenticated'
  const navigate = useNavigate();

  // Set up auth state listener and persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthState("authenticated");
        
        // Update or create user document in Firestore
        try {
          const userDoc = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDoc);
          
          console.log('Firestore document state:', {
            exists: docSnap.exists(),
            data: docSnap.data(),
            metadata: docSnap.metadata
          });
          
          if (!docSnap.exists()) {
            console.log('Creating new user document');
            await setDoc(userDoc, {
              email: user.email,
              createdAt: new Date(),
              lastLogin: new Date(),
              updatedAt: new Date()
            });
          } else {
            console.log('Updating existing user document');
            await setDoc(userDoc, {
              lastLogin: new Date(),
              updatedAt: new Date()
            }, { merge: true });
          }
          
          console.log("User document updated in Firestore");
        } catch (error) {
          console.error('Firestore update error:', error);
        }
        
        navigate("/dashboard");
      } else {
        setAuthState("unauthenticated");
      }
    });

    // Set persistence
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Persistence error:", error);
        setError("Could not set up session persistence. Please try again.");
      });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting login with:", {
        email: email,
        passwordLength: password.length,
        timestamp: new Date().toISOString()
      });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Force refresh user data
      await user.reload();
      
      // Clear any cached data
      await auth.updateCurrentUser(user);
      
      // Force Firestore to refresh
      const userDoc = doc(db, 'users', user.uid);
      await getDoc(userDoc, { source: 'server' });
      
      // Create or update user document with timestamp
      const userData = {
        email: user.email,
        lastLogin: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(userDoc, userData, { merge: true });
      
      console.log('Login successful and database updated:', userData);
      navigate('/dashboard');
    } catch (error) {
      console.error("Detailed login error:", {
        code: error.code,
        message: error.message,
        email: email,
        timestamp: new Date().toISOString(),
        fullError: error
      });

      // More specific error messages
      switch (error.code) {
        case "auth/user-not-found":
          setError("No account found with this email. Please sign up first.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again or use 'Forgot Password'.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later or reset your password.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection.");
          break;
        case "auth/invalid-email":
          setError("Invalid email format. Please check your email address.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled. Please contact support.");
          break;
        default:
          setError(`Login failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handlePasswordReset = () => {
    navigate("/forgot-password");
  };

  if (authState === "checking") {
    return (
      <div className="login-page">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <button className="back-button" onClick={handleBackToHome}>
        <FaArrowLeft /> Back to Home
      </button>
      <div className="login-card">
        <h2>LOG IN</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-field">
            <FaEnvelope className="icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="input-field">
            <FaLock className="icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="toggle-password-button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button
            type="submit"
            className={`login-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="spinner" />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>
        <div className="forgot-password-link">
          <button
            className="reset-password-button"
            onClick={handlePasswordReset}
            disabled={isLoading}
          >
            Forgot Password?
          </button>
        </div>
        <div className="signup-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
