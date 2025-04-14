import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Profile.css'; 

const Profile = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data());
        }
      } else {
        navigate('/login');
      }
    };
    fetchUserData();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, formData);
      alert('Profile updated successfully!');
      setIsEditing(false);
    }
  };

  // Step navigation functions
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <label>Name:</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} />
            <label>Contact Number:</label>
            <input type="tel" name="contactNumber" value={formData.contactNumber || ''} onChange={handleChange} />
            <label>Location:</label>
            <textarea name="location" value={formData.location || ''} onChange={handleChange}></textarea>
          </>
        );
      case 2:
        return (
          <>
            <label>University:</label>
            <textarea name="university" value={formData.university || ''} onChange={handleChange}></textarea>
            <label>Degree:</label>
            <textarea name="degree" value={formData.degree || ''} onChange={handleChange}></textarea>
            <label>Year of Study:</label>
            <input type="text" name="yearOfStudy" value={formData.yearOfStudy || ''} onChange={handleChange} />
            <label>Educational Interests:</label>
            <textarea name="educationalInterests" value={formData.educationalInterests || ''} onChange={handleChange}></textarea>
          </>
        );
      case 3:
        return (
          <>
            <label>Skills:</label>
            <textarea name="skills" value={formData.skills || ''} onChange={handleChange}></textarea>
            <label>Skills to Acquire:</label>
            <textarea name="skillsToAcquire" value={formData.skillsToAcquire || ''} onChange={handleChange}></textarea>
            <label>Career Goals:</label>
            <textarea name="careerGoals" value={formData.careerGoals || ''} onChange={handleChange}></textarea>
            <label>Hobbies:</label>
            <textarea name="hobbies" value={formData.hobbies || ''} onChange={handleChange}></textarea>
          </>
        );
      case 4:
        return (
          <>
            <label>Learning Style:</label>
            <select name="learningStyle" value={formData.learningStyle || ''} onChange={handleChange}>
              <option value="">Select Learning Style</option>
              <option value="Visual">Visual</option>
              <option value="Hands-On">Hands-On</option>
              <option value="Reading">Reading</option>
              <option value="Group Learning">Group Learning</option>
            </select>
            <label>Availability:</label>
            <textarea name="availability" value={formData.availability || ''} onChange={handleChange}></textarea>
            <label>Languages Known:</label>
            <textarea name="languages" value={formData.languages || ''} onChange={handleChange}></textarea>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-container">
      <h2 className="profile-header">Current Profile</h2>

      {isEditing ? (
        <form onSubmit={handleUpdate}>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="navigation-buttons">
            {step > 1 && <button type="button" onClick={prevStep}>Previous</button>}
            {step < 4 && <button type="button" onClick={nextStep}>Next</button>}
            {step === 4 && <button type="submit">Save Changes</button>}
          </div>
        </form>
      ) : (
        <div className="profile-data">
          <p><strong>Name:</strong> <span>{formData.name || 'Not provided'}</span></p>
          <p><strong>Email:</strong> <span>{formData.email || 'Not provided'}</span></p>
          <p><strong>Contact Number:</strong> <span>{formData.contactNumber || 'Not provided'}</span></p>
          <p><strong>Location:</strong> <span>{formData.location || 'Not provided'}</span></p>
          <p><strong>University:</strong> <span>{formData.university || 'Not provided'}</span></p>
          <p><strong>Degree:</strong> <span>{formData.degree || 'Not provided'}</span></p>
          <p><strong>Year of Study:</strong> <span>{formData.yearOfStudy || 'Not provided'}</span></p>
          <p><strong>Educational Interests:</strong> <span>{formData.educationalInterests || 'Not provided'}</span></p>
          <p><strong>Skills:</strong> <span>{formData.skills || 'Not provided'}</span></p>
          <p><strong>Skills to Acquire:</strong> <span>{formData.skillsToAcquire || 'Not provided'}</span></p>
          <p><strong>Career Goals:</strong> <span>{formData.careerGoals || 'Not provided'}</span></p>
          <p><strong>Hobbies:</strong> <span>{formData.hobbies || 'Not provided'}</span></p>
          <p><strong>Learning Style:</strong> <span>{formData.learningStyle || 'Not provided'}</span></p>
          <p><strong>Availability:</strong> <span>{formData.availability || 'Not provided'}</span></p>
          <p><strong>Languages Known:</strong> <span>{formData.languages || 'Not provided'}</span></p>
          
          <div className="edit-button-container">
            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;