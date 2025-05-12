import { useState } from "react";
import { deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from "../firebase";
import "./SavedSkills.css"; // Import CSS for better styling

const SavedSkills = ({ savedSkills, setSelectedSkills, setIsEditing, fetchSavedSkills }) => {
  const [courseData, setCourseData] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(null);
  const [selectedSkills, setSelectedSkillsState] = useState([]);
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  // Delete selected skills from Firestore
  const deleteSelectedSkills = async (id, currentSkills) => {
    try {
      if (selectedSkills.length === currentSkills.length) {
        await deleteDoc(doc(db, "userSkills", id));
      } else {
        const updatedSkills = currentSkills.filter(skill => !selectedSkills.includes(skill));
        await updateDoc(doc(db, "userSkills", id), {
          skills: updatedSkills
        });
      }
      // Also remove from skillsToAcquire in user profile
      if (auth.currentUser) {
        const userProfileRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userProfileRef, {
          skillsToAcquire: arrayRemove(...selectedSkills)
        });
      }
      fetchSavedSkills();
      setSelectedSkillsState([]); // Clear selection after deletion
    } catch (err) {
      console.error("❌ Error updating document:", err);
    }
  };

  // Handle skill selection
  const handleSkillClick = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkillsState(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkillsState([...selectedSkills, skill]);
    }
  };

  // Mark selected skills as learned
  const handleMarkAsLearned = async (id, currentSkills) => {
    if (selectedSkills.length === 0 || !auth.currentUser) return;
    setLoadingTransfer(true);

    try {
      // Update user's profile document
      const userProfileRef = doc(db, "users", auth.currentUser.uid);
      
      // Add skills to skills array and remove from skillsToAcquire
      await updateDoc(userProfileRef, {
        skills: arrayUnion(...selectedSkills),
        skillsToAcquire: arrayRemove(...selectedSkills)
      });

      // Update userSkills collection
      const updatedSkills = currentSkills.filter(skill => !selectedSkills.includes(skill));
      await updateDoc(doc(db, "userSkills", id), {
        skills: updatedSkills,
        updatedAt: new Date().toISOString()
      });

      // Refresh the skills list
      await fetchSavedSkills();
      setSelectedSkillsState([]);
    } catch (err) {
      console.error("Error marking skills as learned:", err);
    } finally {
      setLoadingTransfer(false);
    }
  };

  // Fetch courses for selected skills
  const fetchCourseData = async (id) => {
    if (loadingCourses || selectedSkills.length === 0) return;

    setLoadingCourses(id);
    console.log("📌 Fetching courses for selected skills:", selectedSkills);

    const courseResults = selectedSkills.map((skill) => ({
      skill,
      platforms: [
        {
          name: "YouTube",
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + " course")}`,
        },
        {
          name: "Coursera",
          url: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`,
        },
        {
          name: "Udemy",
          url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}`,
        },
        {
          name: "LinkedIn Learning",
          url: `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(skill)}`,
        },
      ],
    }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("✅ Courses fetched:", courseResults);
      setCourseData((prevData) => ({ ...prevData, [id]: courseResults }));
    } catch (error) {
      console.error("❌ Error fetching courses:", error);
      setCourseData((prevData) => ({ ...prevData, [id]: [] }));
    } finally {
      setLoadingCourses(null);
    }
  };

  return (
    <div className="card">
      <h2 className="section-title">Saved Skills</h2>
      {savedSkills.length === 0 ? (
        <p className="no-skills-text">No saved skills yet. Add some to get started! 🚀</p>
      ) : (
        savedSkills.map((skillSet) => (
          <div key={skillSet.id} className="saved-skill-item">
            <div className="skills-list">
              {skillSet.skills.map((skill) => (
                <div 
                  key={skill} 
                  className={`skill-checkbox ${selectedSkills.includes(skill) ? 'selected' : ''}`}
                  onClick={() => handleSkillClick(skill)}
                >
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSkillClick(skill);
                    }}
                  />
                  <span className="skill-label">{skill}</span>
                </div>
              ))}
            </div>
            <div className="button-group">
              <button
                onClick={() => {
                  setSelectedSkills(skillSet.skills);
                  setIsEditing(true);
                }}
                className="button button-edit"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => deleteSelectedSkills(skillSet.id, skillSet.skills)}
                className="button button-delete"
                disabled={selectedSkills.length === 0}
              >
                ❌ Delete Selected
              </button>
              <button
                onClick={() => handleMarkAsLearned(skillSet.id, skillSet.skills)}
                className="button button-transfer"
                disabled={loadingTransfer || selectedSkills.length === 0}
              >
                {loadingTransfer ? "⏳ Transferring..." : "✓ Mark as Learned"}
              </button>
              <button
                onClick={() => fetchCourseData(skillSet.id)}
                className="button button-courses"
                disabled={loadingCourses === skillSet.id || selectedSkills.length === 0}
              >
                {loadingCourses === skillSet.id ? "⏳ Loading..." : "📚 Get Courses"}
              </button>
            </div>

            {/* Display courses if available */}
            {courseData[skillSet.id] && courseData[skillSet.id].length > 0 && (
              <div className="course-list">
                <h3>🎓 Recommended Courses:</h3>
                {courseData[skillSet.id].map((course) => (
                  <div key={course.skill}>
                    <p>
                      <strong>{course.skill}:</strong>
                    </p>
                    <ul>
                      {course.platforms.map((platform) => (
                        <li key={platform.name}>
                          <a href={platform.url} target="_blank" rel="noopener noreferrer">
                            {platform.name} 🔗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default SavedSkills;
