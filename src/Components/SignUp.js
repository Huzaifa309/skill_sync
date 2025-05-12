import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FaArrowLeft, FaUser, FaGraduationCap, FaCode, FaImage, FaCog } from 'react-icons/fa';
import { countryCodes } from './countryCodes';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './SignUp.css';

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    password: '',
    contactNumber: '',
    dateOfBirth: '',
    location: '',
    
    // Academic Information
    university: '',
    degree: '',
    yearOfStudy: '',
    educationalInterests: '',
    
    // Skills and Interests
    skills: [],
    skillsToAcquire: [],
    careerGoals: '',
    hobbies: '',
    
    // Profile Customization
    profilePicture: null,
    resume: null,
    profilePictureURL: '',
    resumeURL: '',
    
    // Additional Preferences
    learningStyle: '',
    availability: '',
    languages: '',
    subscribeNewsletter: false,
    countryCode: 'US'
  });

  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [skillsToAcquireSearchTerm, setSkillsToAcquireSearchTerm] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      const file = files[0];
      const fileURL = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        [name]: file,
        [`${name}URL`]: fileURL
      }));
    }
  };

  const autoDetectCountry = (location) => {
    if (!location) return;
    
    const locationLower = location.toLowerCase();
    const detectedCountry = countryCodes.find(country => 
      country.country.toLowerCase().includes(locationLower) ||
      locationLower.includes(country.country.toLowerCase())
    );
    
    if (detectedCountry) {
      setFormData(prev => ({
        ...prev,
        countryCode: detectedCountry.code
      }));
    }
  };

  useEffect(() => {
    if (formData.location) {
      autoDetectCountry(formData.location);
    }
  }, [formData.location]);

  useEffect(() => {
    fetch('/skills.txt')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load skills');
        }
        return response.text();
      })
      .then(text => {
        const skills = text.split('\n')
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
        setAvailableSkills(skills);
      })
      .catch(error => {
        console.error('Error loading skills:', error);
        setAvailableSkills([]);
      });
  }, []);

  const handlePhoneChange = (value, country) => {
    setFormData(prev => ({
      ...prev,
      contactNumber: value,
      countryCode: country.countryCode
    }));
  };

  const handleSkillSearch = (e, type) => {
    const value = e.target.value;
    if (type === 'current') {
      setSkillSearchTerm(value);
    } else {
      setSkillsToAcquireSearchTerm(value);
    }
  };

  const handleSkillSelect = (skill, type) => {
    const currentSkills = Array.isArray(formData[type]) ? formData[type] : [];
    
    if (!currentSkills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        [type]: [...currentSkills, skill]
      }));
    }
    
    if (type === 'skills') {
      setSkillSearchTerm('');
    } else {
      setSkillsToAcquireSearchTerm('');
    }
  };

  const handleSkillRemove = (skillToRemove, type) => {
    const currentSkills = Array.isArray(formData[type]) ? formData[type] : [];
    const newSkills = currentSkills.filter(skill => skill !== skillToRemove);
    
    setFormData(prev => ({
      ...prev,
      [type]: newSkills
    }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    const requiredFields = {
      1: ['name', 'email', 'password', 'contactNumber', 'dateOfBirth', 'location'],
      2: ['degree', 'yearOfStudy'],
      3: ['skills', 'careerGoals'],
      4: [], // No required fields in step 4
      5: ['learningStyle']
    };

    requiredFields[currentStep]?.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep(step)) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          ...formData,
          profilePicture: formData.profilePicture?.name || null,
          resume: formData.resume?.name || null,
          createdAt: new Date().toISOString()
        });
        
        navigate('/dashboard');
      } catch (error) {
        console.error('Error signing up:', error);
        setErrors({ submit: error.message });
      }
    }
  };

  const renderStepIcon = () => {
    const icons = {
      1: <FaUser />,
      2: <FaGraduationCap />,
      3: <FaCode />,
      4: <FaImage />,
      5: <FaCog />
    };
    return icons[step] || <FaUser />;
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="personal-info-dialog">
            <h3>Personal Information</h3>
            <div className="form-group">
              <label className="required-field">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={errors.name ? 'error-field' : ''}
              />
              {errors.name && <span className="validation-message">{errors.name}</span>}
            </div>
            
            <div className="form-group">
              <label className="required-field">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? 'error-field' : ''}
              />
              {errors.email && <span className="validation-message">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label className="required-field">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                className={errors.password ? 'error-field' : ''}
              />
              {errors.password && <span className="validation-message">{errors.password}</span>}
            </div>
            
            <div className="form-group">
              <label className="required-field">Contact Number</label>
              <PhoneInput
                country={'us'}
                value={formData.contactNumber}
                onChange={handlePhoneChange}
                inputClass={errors.contactNumber ? 'error-field' : ''}
                containerClass="phone-input-container"
                inputProps={{
                  name: 'contactNumber',
                  required: true,
                  autoFocus: false
                }}
              />
              {errors.contactNumber && <span className="validation-message">{errors.contactNumber}</span>}
            </div>
            
            <div className="form-group">
              <label className="required-field">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={errors.dateOfBirth ? 'error-field' : ''}
              />
              {errors.dateOfBirth && <span className="validation-message">{errors.dateOfBirth}</span>}
            </div>
            
            <div className="form-group">
              <label className="required-field">Location</label>
              <textarea
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter your location"
                rows="2"
                className={errors.location ? 'error-field' : ''}
              />
              {errors.location && <span className="validation-message">{errors.location}</span>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="academic-info-dialog">
            <h3>Academic Information</h3>
            <div className="form-group">
              <label>University/School</label>
              <textarea
                name="university"
                value={formData.university}
                onChange={handleChange}
                placeholder="Enter your university or school name"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label className="required-field">Degree/Program</label>
              <textarea
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="Enter your degree or program"
                rows="2"
                className={errors.degree ? 'error-field' : ''}
              />
              {errors.degree && <span className="validation-message">{errors.degree}</span>}
            </div>

            <div className="form-group">
              <label className="required-field">Year of Study</label>
              <input
                type="text"
                name="yearOfStudy"
                value={formData.yearOfStudy}
                onChange={handleChange}
                placeholder="Enter your year of study"
                className={errors.yearOfStudy ? 'error-field' : ''}
              />
              {errors.yearOfStudy && <span className="validation-message">{errors.yearOfStudy}</span>}
            </div>

            <div className="form-group">
              <label>Educational Interests</label>
              <textarea
                name="educationalInterests"
                value={formData.educationalInterests}
                onChange={handleChange}
                placeholder="Describe your educational interests"
                rows="3"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="skills-interests-dialog">
            <h3>Skills and Interests</h3>
            
            <div className="form-group">
              <label className="required-field">Current Skills</label>
              <div className="skill-input-container">
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={skillSearchTerm}
                  onChange={(e) => handleSkillSearch(e, 'current')}
                  className="skill-search-input"
                />
                <div className="selected-skills">
                  {(Array.isArray(formData.skills) ? formData.skills : [])
                    .map(skill => (
                      <div key={skill} className="skill-tag">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleSkillRemove(skill, 'skills')}
                          className="remove-skill-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
                {skillSearchTerm && (
                  <div className="skill-options">
                    {availableSkills
                      .filter(skill => 
                        skill.toLowerCase().includes(skillSearchTerm.toLowerCase()) &&
                        !(Array.isArray(formData.skills) ? formData.skills : []).includes(skill) &&
                        !(Array.isArray(formData.skillsToAcquire) ? formData.skillsToAcquire : []).includes(skill)
                      )
                      .slice(0, 10)
                      .map(skill => (
                        <div
                          key={skill}
                          className="skill-option"
                          onClick={() => handleSkillSelect(skill, 'skills')}
                        >
                          {skill}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {errors.skills && <span className="validation-message">{errors.skills}</span>}
            </div>

            <div className="form-group">
              <label>Skills to Acquire</label>
              <div className="skill-input-container">
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={skillsToAcquireSearchTerm}
                  onChange={(e) => handleSkillSearch(e, 'acquire')}
                  className="skill-search-input"
                />
                <div className="selected-skills">
                  {(Array.isArray(formData.skillsToAcquire) ? formData.skillsToAcquire : [])
                    .map(skill => (
                      <div key={skill} className="skill-tag">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleSkillRemove(skill, 'skillsToAcquire')}
                          className="remove-skill-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
                {skillsToAcquireSearchTerm && (
                  <div className="skill-options">
                    {availableSkills
                      .filter(skill => 
                        skill.toLowerCase().includes(skillsToAcquireSearchTerm.toLowerCase()) &&
                        !(Array.isArray(formData.skillsToAcquire) ? formData.skillsToAcquire : []).includes(skill) &&
                        !(Array.isArray(formData.skills) ? formData.skills : []).includes(skill)
                      )
                      .slice(0, 10)
                      .map(skill => (
                        <div
                          key={skill}
                          className="skill-option"
                          onClick={() => handleSkillSelect(skill, 'skillsToAcquire')}
                        >
                          {skill}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {errors.skillsToAcquire && <span className="validation-message">{errors.skillsToAcquire}</span>}
            </div>

            <div className="form-group">
              <label className="required-field">Career Goals</label>
              <textarea
                name="careerGoals"
                value={formData.careerGoals}
                onChange={handleChange}
                placeholder="Describe your career goals"
                rows="4"
                className={errors.careerGoals ? 'error-field' : ''}
              />
              {errors.careerGoals && <span className="validation-message">{errors.careerGoals}</span>}
            </div>

            <div className="form-group">
              <label>Interests/Hobbies</label>
              <textarea
                name="hobbies"
                value={formData.hobbies}
                onChange={handleChange}
                placeholder="Describe your interests and hobbies"
                rows="4"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="profile-customization-dialog">
            <h3>Profile Customization</h3>
            <div className="form-group">
              <label>Profile Picture</label>
              <input
                type="file"
                name="profilePicture"
                accept="image/*"
                onChange={handleFileChange}
              />
              {formData.profilePictureURL && (
                <div className="file-preview">
                  <img src={formData.profilePictureURL} alt="Profile Preview" className="image-preview" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Resume Upload</label>
              <input
                type="file"
                name="resume"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="preferences-dialog">
            <h3>Additional Preferences</h3>
            <div className="form-group">
              <label className="required-field">Preferred Learning Style</label>
              <select
                name="learningStyle"
                value={formData.learningStyle}
                onChange={handleChange}
                className={errors.learningStyle ? 'error-field' : ''}
              >
              <option value="">Select Learning Style</option>
              <option value="Visual">Visual</option>
              <option value="Hands-On">Hands-On</option>
              <option value="Reading">Reading</option>
              <option value="Group Learning">Group Learning</option>
            </select>
              {errors.learningStyle && <span className="validation-message">{errors.learningStyle}</span>}
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="subscribeNewsletter"
                  checked={formData.subscribeNewsletter}
                  onChange={handleChange}
                />
                Subscribe to Newsletter
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="signup-container">
      <button className="back-button" onClick={() => navigate('/')}>
        <FaArrowLeft /> Back to Home
      </button>

      <form onSubmit={handleSubmit} className="signup-form">
        <div className="step-indicator">
          {renderStepIcon()}
          <span>Step {step} of 5</span>
        </div>

        {renderStepContent()}

        {errors.submit && <div className="error-message">{errors.submit}</div>}
        
        <div className="navigation-buttons">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="nav-button prev-button">
              Previous
            </button>
          )}
          {step < 5 ? (
            <button type="button" onClick={nextStep} className="nav-button next-button">
              Next
            </button>
          ) : (
            <button type="submit" className="nav-button submit-button">
              Sign Up
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SignUp;
