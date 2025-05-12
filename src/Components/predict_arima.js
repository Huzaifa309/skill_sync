import React, { useEffect, useRef, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import './predict_arima.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PredictArima = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ranges, setRanges] = useState({});
  const [forecast, setForecast] = useState(null);
  const [graphSkill, setGraphSkill] = useState('');
  const [graphYears, setGraphYears] = useState(3);
  const [graphLoading, setGraphLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawResponse, setRawResponse] = useState(null);
  const [showGraph, setShowGraph] = useState(false);
  const graphRef = useRef(null);

  useEffect(() => {
    const fetchCurrentSkills = async () => {
      if (!auth.currentUser) return;
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          let currentSkills = [];
          if (Array.isArray(userData.skills)) {
            currentSkills = userData.skills.filter(s => typeof s === 'string' && s.trim().length > 0);
          } else if (typeof userData.skills === 'string') {
            currentSkills = userData.skills
              .split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0);
          } else {
            console.error('User skills are not an array or string:', userData.skills);
          }
          setSkills(currentSkills);
        } else {
          setSkills([]);
        }
      } catch (err) {
        setSkills([]);
        console.error('Error fetching user skills:', err);
      }
      setLoading(false);
    };
    fetchCurrentSkills();
  }, []);

  const handleRangeChange = (skill, value) => {
    setRanges(prev => ({ ...prev, [skill]: value }));
  };

  const handlePredict = async (skill) => {
    setError('');
    setForecast(null);
    setGraphSkill(skill);
    const years = parseInt(ranges[skill] || 3, 10);
    setGraphYears(years);
    setGraphLoading(true);

    if (years === 3) {
      try {
        const forecastDocRef = doc(db, 'forecasts', skill);
        const forecastDocSnap = await getDoc(forecastDocRef);
        if (forecastDocSnap.exists()) {
          const data = forecastDocSnap.data();
          const currentYear = new Date().getFullYear();
          const sliced = [0, 1, 2].map(i => {
            const year = (currentYear + i).toString();
            if (!(year in data)) throw new Error(`Missing year ${year} in cache`);
            const value = data[year];
            return {
              year: parseInt(year),
              value,
              lower_ci: value * 0.95,
              upper_ci: value * 1.05,
            };
          });
          setForecast(sliced);
          setShowGraph(true);
        } else {
          setError('No cached forecast found for this skill.');
        }
      } catch (err) {
        setError('Error fetching cached forecast.');
      }
      setGraphLoading(false);
      setTimeout(() => {
        if (graphRef.current) graphRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    // For any other value, always call FastAPI
    try {
      const response = await fetch('/forecast/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, forecast_years: years })
      });
      if (!response.ok) throw new Error('API error');
      const result = await response.json();
      setForecast(result);
      setShowGraph(true);
    } catch (err) {
      setError('Prediction failed. Please try again.');
    }
    setGraphLoading(false);
    setTimeout(() => {
      if (graphRef.current) graphRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Prepare data for Chart.js
  const chartData = forecast
    ? {
        labels: forecast.map(item => item.year),
        datasets: [
          {
            label: 'Predicted Value',
            data: forecast.map(item => item.value),
            fill: false,
            borderColor: '#3498db',
            backgroundColor: '#3498db',
            tension: 0.2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 3,
          },
          {
            label: 'Upper Confidence Interval',
            data: forecast.map(item => item.upper_ci),
            fill: '+1',
            borderColor: 'rgba(40, 167, 69, 0.7)',
            backgroundColor: 'rgba(40, 167, 69, 0.15)',
            pointRadius: 0,
            borderWidth: 2,
            borderDash: [5,5],
          },
          {
            label: 'Lower Confidence Interval',
            data: forecast.map(item => item.lower_ci),
            fill: false,
            borderColor: 'rgba(220, 53, 69, 0.7)',
            backgroundColor: 'rgba(220, 53, 69, 0.15)',
            pointRadius: 0,
            borderWidth: 2,
            borderDash: [5,5],
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: graphSkill ? `Forecast for ${graphSkill} (${graphYears} years)` : 'Skill Forecast',
        font: { size: 20 },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year',
          font: { size: 16 },
        }
      },
      y: {
        title: {
          display: true,
          text: 'Predicted Value',
          font: { size: 16 },
        },
        beginAtZero: true,
      }
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
  };

  return (
    <div className="arima-container">
      {loading ? (
        <p>Loading your skills...</p>
      ) : showGraph && forecast && chartData ? (
        <div className="arima-graph-modal">
          <button className="arima-close-btn" onClick={() => { setShowGraph(false); setForecast(null); }}>
            ×
          </button>
          <div className="arima-graph-explanation" style={{ maxWidth: '900px', margin: '0 auto 1.5rem auto', background: '#f8f9fa', borderRadius: '12px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(52, 152, 219, 0.08)' }}>
            <strong><span style={{color:'#000000', fontWeight:'bold'}}>How to Read This Graph:</span></strong>
            <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0, fontSize: '1rem' }}>
              <li><span style={{color:'#3498db', fontWeight:'bold'}}>Blue line: Predicted value for your skill each year.</span></li>
              <li><span style={{color:'#28a745', fontWeight:'bold'}}>Green dashed line: Upper confidence interval (highest likely value).</span></li>
              <li><span style={{color:'#dc3545', fontWeight:'bold'}}>Red dashed line: Lower confidence interval (lowest likely value).</span></li>
              <li><span style={{color:'#000000', fontWeight:'bold'}}>The area between green and red shows the most likely range.</span></li>
              <li><strong><span style={{color:'#000000', fontWeight:'bold'}}>Y-Axis (Predicted Value):</span></strong><span style={{color:'#000000', fontWeight:'bold'}}> Starts at 0 and increases upwards. Higher values indicate greater demand or importance for the skill.</span></li>
            </ul>
          </div>
          <div ref={graphRef} className="arima-graph-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : skills.length === 0 ? (
        <p>No skills found. Please add your current skills in your profile.</p>
      ) : (
        <div className="arima-skills-list">
          {skills.map(skill => (
            <div className="arima-skill-item" key={skill}>
              <span className="arima-skill-label">{skill}</span>
              <div className="arima-range-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={ranges[skill] || 3}
                  onChange={e => handleRangeChange(skill, e.target.value)}
                  className="arima-range-input"
                />
                <span className="arima-range-value">{ranges[skill] || 3}</span>
                <span style={{ color: '#3498db', fontSize: '14px' }}>years</span>
                <button className="arima-predict-btn" onClick={() => handlePredict(skill)}>
                  Predict
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {graphLoading && <p>Loading prediction...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default PredictArima;