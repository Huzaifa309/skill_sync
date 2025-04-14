import { useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import "./SavedSkills.css"; // Import CSS for better styling

const SavedSkills = ({ savedSkills, setSelectedSkills, setIsEditing, fetchSavedSkills }) => {
  const [courseData, setCourseData] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(null);

  // Delete saved skills from Firestore
  const deleteSkillsFromFirestore = async (id) => {
    try {
      await deleteDoc(doc(db, "userSkills", id));
      fetchSavedSkills();
    } catch (err) {
      console.error("❌ Error deleting document:", err);
    }
  };

  // Fetch courses for each skill
  const fetchCourseData = async (skills, id) => {
    if (loadingCourses) return; // Prevent multiple requests

    setLoadingCourses(id);

    console.log("📌 Fetching courses for skills:", skills);

    const courseResults = skills.map((skill) => ({
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
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
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
            <p className="saved-skill-text">
              <strong>Skills:</strong> {skillSet.skills.join(", ")}
            </p>
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
              <button onClick={() => deleteSkillsFromFirestore(skillSet.id)} className="button button-delete">
                ❌ Delete
              </button>
              <button
                onClick={() => fetchCourseData(skillSet.skills, skillSet.id)}
                className="button button-courses"
                disabled={loadingCourses === skillSet.id}
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
