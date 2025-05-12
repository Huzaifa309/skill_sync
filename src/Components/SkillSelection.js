import { useState, useEffect, useMemo, useRef } from "react"
import { auth, db } from "../firebase"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import SavedSkills from "./SavedSkills"
import "./SkillSelection.css"

const SkillSelection = () => {
  const [selectedSkills, setSelectedSkills] = useState([])
  const [savedSkills, setSavedSkills] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [skillCategories, setSkillCategories] = useState({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [existingSkills, setExistingSkills] = useState([])

  const searchInputRef = useRef(null);
  const categoryButtonsRef = useRef([]);
  const skillCheckboxesRef = useRef([]);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch skills from skills.txt
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch('/skills.txt');
        if (!response.ok) {
          throw new Error('Failed to load skills');
        }
        const text = await response.text();
        const skills = text.split('\n')
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);

        // Group skills by their first letter for categorization
        const groupedSkills = skills.reduce((acc, skill) => {
          const category = skill.charAt(0).toUpperCase();
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(skill);
          return acc;
        }, {});

        setSkillCategories(groupedSkills);
      } catch (error) {
        console.error('Error loading skills:', error);
        setSkillCategories({});
      }
    };

    fetchSkills();
  }, []);

  const handleSkillSelect = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills(prev => [...prev, skill]);
    }
    setIsDropdownOpen(false);
  };

  const handleSkillRemove = (skillToRemove) => {
    setSelectedSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const handleSkillTransfer = async () => {
    if (selectedSkills.length === 0 || !auth.currentUser) return;
    setLoading(true);

    try {
      // Update user's profile document
      const userProfileRef = doc(db, "users", auth.currentUser.uid);
      
      // Add skills to skills array and remove from skillsToAcquire
      await updateDoc(userProfileRef, {
        skills: arrayUnion(...selectedSkills),
        skillsToAcquire: arrayRemove(...selectedSkills)
      });

      // Update userSkills collection
      const userSkillsQuery = query(collection(db, "userSkills"), where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(userSkillsQuery);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const docRef = doc(db, "userSkills", existingDoc.id);
        await updateDoc(docRef, {
          skills: arrayRemove(...selectedSkills),
          updatedAt: new Date().toISOString()
        });
      }

      // Refresh the skills list
      await fetchSavedSkills();
    } catch (err) {
      console.error("Error transferring skills:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderSkillDropdown = () => {
    if (!isDropdownOpen) return null;

    return (
      <div className="skill-dropdown" ref={dropdownRef}>
        <div className="dropdown-header">
          <input
            type="text"
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dropdown-search"
          />
        </div>
        <div className="dropdown-content">
          {Object.entries(skillCategories)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, skills]) => {
              const availableSkills = skills.filter(skill =>
                skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !selectedSkills.includes(skill) &&
                !existingSkills.includes(skill)
              );

              const existingSkillsInCategory = skills.filter(skill =>
                skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
                existingSkills.includes(skill)
              );

              if (availableSkills.length === 0 && existingSkillsInCategory.length === 0) return null;

              return (
                <div key={category} className="dropdown-category">
                  <div className="category-header">{category}</div>
                  <div className="category-skills">
                    {availableSkills.map(skill => (
                      <div
                        key={skill}
                        className={`dropdown-skill${selectedSkills[0] === skill ? ' selected-for-transfer' : ''}`}
                        onClick={() => handleSkillSelect(skill)}
                      >
                        {skill}
                        {selectedSkills[0] === skill && (
                          <span className="transfer-indicator">✓</span>
                        )}
                      </div>
                    ))}
                    {existingSkillsInCategory.map(skill => (
                      <div
                        key={skill}
                        className="dropdown-skill existing-skill"
                        title="This skill is already in your skillset"
                      >
                        {skill}
                        <span className="existing-skill-message">(Already in your skillset)</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (auth.currentUser) {
      fetchSavedSkills()
    }
  }, [])

  const fetchSavedSkills = async () => {
    if (!auth.currentUser) return
    setLoading(true)

    try {
      // First try to get skills from userSkills collection
      const userSkillsQuery = query(collection(db, "userSkills"), where("userId", "==", auth.currentUser.uid))
      const querySnapshot = await getDocs(userSkillsQuery)

      // Then get the user's profile to check skillsToAcquire and existing skills
      const userProfileRef = doc(db, "users", auth.currentUser.uid)
      const userProfileSnap = await getDoc(userProfileRef)
      
      let skills = []
      let existingSkills = []
      
      if (userProfileSnap.exists()) {
        // Get existing skills from profile
        const profileData = userProfileSnap.data()
        existingSkills = Array.isArray(profileData.skills) 
          ? profileData.skills 
          : (profileData.skills || '').split(',').map(s => s.trim()).filter(Boolean)
      }
      
      if (!querySnapshot.empty) {
        // If multiple documents exist, delete all but the first one
        if (querySnapshot.docs.length > 1) {
          const docsToDelete = querySnapshot.docs.slice(1)
          for (const doc of docsToDelete) {
            await deleteDoc(doc.ref)
          }
        }
        
        const docData = querySnapshot.docs[0]
        skills = docData.data().skills
        setSavedSkills({ id: docData.id, skills: skills })
      } else if (userProfileSnap.exists() && userProfileSnap.data().skillsToAcquire) {
        // If no userSkills document but profile has skillsToAcquire
        const profileSkills = userProfileSnap.data().skillsToAcquire
        skills = Array.isArray(profileSkills) 
          ? profileSkills 
          : profileSkills.split(',').map(s => s.trim()).filter(Boolean)
        
        // Create a new userSkills document
        const docRef = await addDoc(collection(db, "userSkills"), {
          userId: auth.currentUser.uid,
          skills: skills,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        setSavedSkills({ id: docRef.id, skills: skills })
      } else {
        setSavedSkills(null)
        skills = []
      }
      
      setSelectedSkills(skills)
      // Store existing skills in state for filtering
      setExistingSkills(existingSkills)
    } catch (err) {
      console.error("Error fetching saved skills:", err)
    } finally {
      setLoading(false)
    }
  }

  const saveSkillsToFirestore = async () => {
    if (selectedSkills.length === 0 || !auth.currentUser) return
    setLoading(true)

    try {
      // Update userSkills collection
      const userSkillsQuery = query(collection(db, "userSkills"), where("userId", "==", auth.currentUser.uid))
      const querySnapshot = await getDocs(userSkillsQuery)

      if (!querySnapshot.empty) {
        // Update existing document
        const existingDoc = querySnapshot.docs[0]
        const docRef = doc(db, "userSkills", existingDoc.id)
        await updateDoc(docRef, {
          skills: selectedSkills,
          updatedAt: new Date().toISOString()
        })
        setSavedSkills({ id: existingDoc.id, skills: selectedSkills })
      } else {
        // Create new document if none exists
        const docRef = await addDoc(collection(db, "userSkills"), {
          userId: auth.currentUser.uid,
          skills: selectedSkills,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        setSavedSkills({ id: docRef.id, skills: selectedSkills })
      }

      // Update user's profile document with skillsToAcquire as array
      const userProfileRef = doc(db, "users", auth.currentUser.uid)
      await updateDoc(userProfileRef, {
        skillsToAcquire: selectedSkills
      })

      setSelectedSkills([])
      setIsEditing(false)
    } catch (err) {
      console.error("Error saving skills:", err)
    } finally {
      setLoading(false)
    }
  }

  const renderSkillsSection = () => {
    if (loading) {
      return <p>Loading...</p>;
    }

    if (savedSkills && !isEditing) {
      return (
        <SavedSkills
          savedSkills={[savedSkills]}
          setSelectedSkills={setSelectedSkills}
          setIsEditing={setIsEditing}
          fetchSavedSkills={fetchSavedSkills}
        />
      );
    }

    return (
      <div className="skills-section">
        <div className="selected-skills-container">
          <h3>Selected Skills</h3>
          <div className="selected-skills">
            {selectedSkills.map(skill => (
              <div key={skill} className="skill-tag">
                {skill}
                <button
                  type="button"
                  onClick={() => handleSkillRemove(skill)}
                  className="remove-skill-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="add-skills-container">
          <button
            className="add-skills-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {isDropdownOpen ? 'Close Skills List' : 'Add Skills'}
          </button>
          {renderSkillDropdown()}
        </div>

        <div className="action-buttons">
          <button 
            onClick={saveSkillsToFirestore} 
            className="button button-primary" 
            disabled={loading || selectedSkills.length === 0}
          >
            {loading ? "Saving..." : "Save Skills"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container" role="main">
      <div className="content">
        <div className="card">
          <h2 className="section-title">
            {isEditing ? "Edit Your Skills" : "Choose the skills you want to learn"}
          </h2>
          {renderSkillsSection()}
        </div>
      </div>
    </div>
  );
};

export default SkillSelection;