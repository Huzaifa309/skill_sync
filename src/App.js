import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './Components/ThemeToggle';
import Home from './Components/Home';
import SignUp from './Components/SignUp';
import Login from './Components/Login';
import Profile from './Components/Profile';
import Dashboard from './Components/Dashboard';
import ForgotPassword from './Components/ForgotPassword';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ThemeToggle />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
