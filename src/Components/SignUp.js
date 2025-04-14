import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FaArrowLeft } from 'react-icons/fa';
import './SignUp.css';

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contactNumber: '',
    dateOfBirth: '',
    location: '',
    university: '',
    degree: '',
    yearOfStudy: '',
    educationalInterests: '',
    skills: '',
    skillsToAcquire: '',
    careerGoals: '',
    hobbies: '',
    profilePicture: null,
    resume: null,
    learningStyle: '',
    availability: '',
    languages: '',
    subscribeNewsletter: false,
    profilePictureURL: '',
    resumeURL: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      const file = files[0];
      const fileURL = URL.createObjectURL(file);
      setFormData((prevData) => ({
        ...prevData,
        [name]: file,
        [`${name}URL`]: fileURL
      }));
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    let requiredFields = [];

    if (currentStep === 1) {
      requiredFields = ['name', 'email', 'password', 'contactNumber', 'dateOfBirth', 'location'];
    } else if (currentStep === 2) {
      requiredFields = ['university', 'degree', 'yearOfStudy', 'educationalInterests'];
    } else if (currentStep === 3) {
      requiredFields = ['skills', 'skillsToAcquire', 'careerGoals', 'hobbies'];
    } else if (currentStep === 4) {
      requiredFields = ['profilePicture', 'resume'];
    } else if (currentStep === 5) {
      requiredFields = ['learningStyle'];
    }

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
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
          profilePicture: formData.profilePicture ? formData.profilePicture.name : null,
          resume: formData.resume ? formData.resume.name : null,
        });
        
        navigate('/dashboard');
      } catch (error) {
        console.error('Error signing up:', error);
        setErrors({ submit: 'Error signing up. Please try again.' });
      }
    }
  };

  const getFieldClassName = (fieldName) => {
    return errors[fieldName] ? 'error-field' : '';
  };

  return (
    <div className="signup-container">
      <button className="back-button" onClick={() => navigate('/')}>
        <FaArrowLeft /> Back to Home
      </button>
      <div className="signup-header">
        <h2>SIGN UP</h2>
      </div>
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <h3>Personal Information</h3>
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={getFieldClassName('name')}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
            
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={getFieldClassName('email')}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
            
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={getFieldClassName('password')}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
            
            <label>Contact Number:</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className={getFieldClassName('contactNumber')}
            />
            {errors.contactNumber && <span className="error-message">{errors.contactNumber}</span>}
            
            <label>Date of Birth:</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={getFieldClassName('dateOfBirth')}
            />
            {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
            
            <label>Location:</label>
            <textarea
              name="location"
              value={formData.location}
              onChange={handleChange}
              rows="2"
              className={getFieldClassName('location')}
            ></textarea>
            {errors.location && <span className="error-message">{errors.location}</span>}
          </>
        )}

        {step === 2 && (
          <>
            <h3>Academic Information</h3>
            <textarea name="university" value={formData.university} onChange={handleChange} rows="2" placeholder="University/School"></textarea>
            <textarea name="degree" value={formData.degree} onChange={handleChange} rows="2" placeholder="Degree/Program"></textarea>
            <input type="text" name="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange} placeholder="Year of Study" />
            <textarea name="educationalInterests" value={formData.educationalInterests} onChange={handleChange} rows="3" placeholder="Educational Interests"></textarea>
          </>
        )}

        {step === 3 && (
          <>
            <h3>Skills and Interests</h3>
            <textarea name="skills" value={formData.skills} onChange={handleChange} rows="3" placeholder="Current Skills"></textarea>
            <textarea name="skillsToAcquire" value={formData.skillsToAcquire} onChange={handleChange} rows="3" placeholder="Skills to Acquire"></textarea>
            <textarea name="careerGoals" value={formData.careerGoals} onChange={handleChange} rows="4" placeholder="Career Goals"></textarea>
            <textarea name="hobbies" value={formData.hobbies} onChange={handleChange} rows="4" placeholder="Interests/Hobbies"></textarea>
          </>
        )}

        {step === 4 && (
          <>
            <h3>Profile Customization</h3>
            <label>Profile Picture:</label>
            <input type="file" name="profilePicture" accept="image/*" onChange={handleFileChange} />
            <label>Resume Upload:</label>
            <input type="file" name="resume" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          </>
        )}

        {step === 5 && (
          <>
            <h3>Additional Preferences</h3>
            <label>Preferred Learning Style:</label>
            <select name="learningStyle" value={formData.learningStyle} onChange={handleChange}>
              <option value="">Select Learning Style</option>
              <option value="Visual">Visual</option>
              <option value="Hands-On">Hands-On</option>
              <option value="Reading">Reading</option>
              <option value="Group Learning">Group Learning</option>
            </select>
          </>
        )}

        {errors.submit && <div className="error-message">{errors.submit}</div>}
        
        <div className="navigation-buttons">
          {step > 1 && <button type="button" onClick={prevStep}>Previous</button>}
          {step < 5 && <button type="button" onClick={nextStep}>Next</button>}
          {step === 5 && <button type="submit">Sign Up</button>}
        </div>
      </form>
    </div>
  );
};

export default SignUp;
