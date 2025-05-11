import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import './Profile.css'; 

const Profile = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [skillsToAcquireSearchTerm, setSkillsToAcquireSearchTerm] = useState('');
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

  useEffect(() => {
    fetch('/skills.txt')
      .then(response => response.text())
      .then(text => {
        const skills = text.split('\n').map(skill => skill.trim()).filter(skill => skill.length > 0);
        setAvailableSkills(skills);
      })
      .catch(() => setAvailableSkills([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (user) {
      try {
        // Update user profile
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, formData);

        // If skillsToAcquire was updated, also update the userSkills collection
        if (formData.skillsToAcquire) {
          const userSkillsQuery = query(collection(db, "userSkills"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(userSkillsQuery);
          
          const skills = Array.isArray(formData.skillsToAcquire) 
            ? formData.skillsToAcquire 
            : formData.skillsToAcquire.split(',').map(s => s.trim());

          if (!querySnapshot.empty) {
            // Update existing document
            const existingDoc = querySnapshot.docs[0];
            const docRefSkills = doc(db, "userSkills", existingDoc.id);
            await updateDoc(docRefSkills, {
              skills: skills,
              updatedAt: new Date().toISOString()
            });
          } else {
            // Create new document if none exists
            await addDoc(collection(db, "userSkills"), {
              userId: user.uid,
              skills: skills,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }

        alert('Profile updated successfully!');
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating profile:", error);
        alert('Error updating profile. Please try again.');
      }
    }
  };

  // Step navigation functions
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSkillSearch = (e, type) => {
    const value = e.target.value;
    if (type === 'current') {
      setSkillSearchTerm(value);
    } else {
      setSkillsToAcquireSearchTerm(value);
    }
  };

  const handleSkillSelect = (skill, type) => {
    const currentSkills = (formData[type] || '').split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (!currentSkills.includes(skill)) {
      const newSkills = currentSkills.length > 0
        ? `${currentSkills.join(', ')}, ${skill}`
        : skill;
      setFormData(prev => ({ ...prev, [type]: newSkills }));
    }

    if (type === 'skills') {
      setSkillSearchTerm('');
    } else {
      setSkillsToAcquireSearchTerm('');
    }
  };

  const handleSkillRemove = (skillToRemove, type) => {
    const currentSkills = (formData[type] || '').split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s !== skillToRemove);

    setFormData(prev => ({
      ...prev,
      [type]: currentSkills.join(', ')
    }));
  };

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
            <div className="skill-input-container">
              <input
                type="text"
                placeholder="Search skills..."
                value={skillSearchTerm}
                onChange={(e) => handleSkillSearch(e, 'current')}
                className="skill-search-input"
              />
              <div className="selected-skills">
                {(formData.skills || '').split(',')
                  .map(s => s.trim())
                  .filter(s => s.length > 0)
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
                      !(formData.skills || '').split(',').map(s => s.trim()).includes(skill)
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

            <label>Skills to Acquire:</label>
            <div className="skill-input-container">
              <input
                type="text"
                placeholder="Search skills..."
                value={skillsToAcquireSearchTerm}
                onChange={(e) => handleSkillSearch(e, 'acquire')}
                className="skill-search-input"
              />
              <div className="selected-skills">
                {(formData.skillsToAcquire || '').split(',')
                  .map(s => s.trim())
                  .filter(s => s.length > 0)
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
                      !(formData.skillsToAcquire || '').split(',').map(s => s.trim()).includes(skill)
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

  const formatValue = (value) => {
    if (!value) return 'Not provided';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return JSON.stringify(value);
    }
    return value;
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
          <p><strong>Name:</strong> <span>{formatValue(formData.name)}</span></p>
          <p><strong>Email:</strong> <span>{formatValue(formData.email)}</span></p>
          <p><strong>Contact Number:</strong> <span>{formatValue(formData.contactNumber)}</span></p>
          <p><strong>Location:</strong> <span>{formatValue(formData.location)}</span></p>
          <p><strong>University:</strong> <span>{formatValue(formData.university)}</span></p>
          <p><strong>Degree:</strong> <span>{formatValue(formData.degree)}</span></p>
          <p><strong>Year of Study:</strong> <span>{formatValue(formData.yearOfStudy)}</span></p>
          <p><strong>Educational Interests:</strong> <span>{formatValue(formData.educationalInterests)}</span></p>
          <p><strong>Skills:</strong> <span>{formatValue(formData.skills)}</span></p>
          <p><strong>Skills to Acquire:</strong> <span>{formatValue(formData.skillsToAcquire)}</span></p>
          <p><strong>Career Goals:</strong> <span>{formatValue(formData.careerGoals)}</span></p>
          <p><strong>Hobbies:</strong> <span>{formatValue(formData.hobbies)}</span></p>
          <p><strong>Learning Style:</strong> <span>{formatValue(formData.learningStyle)}</span></p>
          <p><strong>Availability:</strong> <span>{formatValue(formData.availability)}</span></p>
          <p><strong>Languages Known:</strong> <span>{formatValue(formData.languages)}</span></p>
          
          <div className="edit-button-container">
            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
