"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence,
  browserSessionPersistence,
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
  const [staySignedIn, setStaySignedIn] = useState(false);
  const navigate = useNavigate();

  // Check persistence state on mount
  useEffect(() => {
    const checkPersistence = async () => {
      try {
        // Force session persistence by default
        await setPersistence(auth, browserSessionPersistence);
        
        // If there's a user but staySignedIn is false, sign them out
        if (auth.currentUser && !staySignedIn) {
          await auth.signOut();
        }
      } catch (error) {
        console.error("Error setting persistence:", error);
      }
    };
    
    checkPersistence();
  }, []);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // If user exists but staySignedIn is false, sign them out
        if (!staySignedIn) {
          await auth.signOut();
          setAuthState("unauthenticated");
          return;
        }

        setAuthState("authenticated");
        
        try {
          const userDoc = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDoc);
          
          if (!docSnap.exists()) {
            await setDoc(userDoc, {
              email: user.email,
              createdAt: new Date(),
              lastLogin: new Date(),
              updatedAt: new Date()
            });
          } else {
            await setDoc(userDoc, {
              lastLogin: new Date(),
              updatedAt: new Date()
            }, { merge: true });
          }
        } catch (error) {
          console.error('Firestore update error:', error);
        }
        
        navigate("/dashboard");
      } else {
        setAuthState("unauthenticated");
      }
    });

    return () => unsubscribe();
  }, [navigate, staySignedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      // Always sign out first to ensure clean state
      if (auth.currentUser) {
        await auth.signOut();
      }

      // Set persistence based on checkbox
      await setPersistence(auth, staySignedIn ? browserLocalPersistence : browserSessionPersistence);
      
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
          <div className="stay-signed-in">
            <input
              type="checkbox"
              id="staySignedIn"
              checked={staySignedIn}
              onChange={(e) => setStaySignedIn(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="staySignedIn">Stay signed in</label>
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
