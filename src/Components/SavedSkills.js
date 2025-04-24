import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./SavedSkills.css"; // Import CSS for better styling

const SavedSkills = ({ savedSkills, setSelectedSkills, setIsEditing, fetchSavedSkills }) => {
  const [courseData, setCourseData] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(null);
  const [selectedSkills, setSelectedSkillsState] = useState([]);

  // Delete selected skills from Firestore
  const deleteSelectedSkills = async (id, currentSkills) => {
    try {
      if (selectedSkills.length === currentSkills.length) {
        // If all skills are selected, delete the entire document
      await deleteDoc(doc(db, "userSkills", id));
      } else {
        // Otherwise, update the document to remove only selected skills
        const updatedSkills = currentSkills.filter(skill => !selectedSkills.includes(skill));
        await updateDoc(doc(db, "userSkills", id), {
          skills: updatedSkills
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
