import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { fetchCourseData } from '../utils/fetchCourseData';

const SkillSelection = () => {
  const skillCategories = {
    'Programming Languages': ['JavaScript', 'Python', 'Java', 'C', 'C++', 'Ruby', 'Go', 'Swift', 'Rust', 'PHP'],
    'Web Development': ['React', 'Vue.js', 'Angular', 'HTML', 'CSS', 'Node.js', 'Bootstrap', 'Tailwind CSS', 'SASS', 'Webpack', 'Express.js', 'GraphQL'],
    'Data Science': ['Python', 'R', 'TensorFlow', 'Keras', 'PyTorch', 'Pandas', 'NumPy', 'Matplotlib', 'SQL', 'Tableau', 'Excel', 'Machine Learning', 'Deep Learning'],
    'DevOps': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Terraform', 'Ansible', 'Jenkins', 'Nagios', 'Prometheus', 'Linux', 'Bash'],
    'Databases': ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Oracle', 'Redis', 'Cassandra', 'Firebase'],
    'Version Control': ['Git', 'GitHub', 'GitLab', 'Bitbucket'],
    'Cloud Platforms': ['Amazon Web Services (AWS)', 'Google Cloud Platform (GCP)', 'Microsoft Azure', 'IBM Cloud'],
  };

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [savedSkills, setSavedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [courseData, setCourseData] = useState([]);

  useEffect(() => {
    if (auth.currentUser) {
      fetchSavedSkills();
    }
  }, []);

  const fetchSavedSkills = async () => {
    if (!auth.currentUser) return;

    const userSkillsQuery = query(
      collection(db, 'userSkills'),
      where('userId', '==', auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(userSkillsQuery);
    const skillsArray = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      skills: doc.data().skills,
    }));

    setSavedSkills(skillsArray);
  };

  const handleSkillChange = (event) => {
    const skill = event.target.value;
    setSelectedSkills((prevSelectedSkills) => {
      if (prevSelectedSkills.includes(skill)) {
        return prevSelectedSkills.filter((item) => item !== skill);
      } else {
        return [...prevSelectedSkills, skill];
      }
    });
  };

  const saveSkillsToFirestore = async () => {
    if (selectedSkills.length === 0 || !auth.currentUser) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'userSkills'), {
        userId: auth.currentUser.uid,
        skills: selectedSkills,
      });
      setSavedSkills((prev) => [...prev, { id: docRef.id, skills: selectedSkills }]);
      setSelectedSkills([]);
    } catch (e) {
      console.error('Error adding document: ', e);
    } finally {
      setLoading(false);
    }
  };

  const deleteSkillsFromFirestore = async (id) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'userSkills', id));
      setSavedSkills((prev) => prev.filter((skillSet) => skillSet.id !== id));
      // Clear the courses if the deleted skills were being displayed
      if (courseData.length > 0) {
        setCourseData([]);
      }
    } catch (e) {
      console.error('Error deleting document: ', e);
    } finally {
      setLoading(false);
    }
  };

  const updateSkillsInFirestore = async () => {
    if (!currentEditId || selectedSkills.length === 0) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'userSkills', currentEditId), {
        skills: selectedSkills,
      });
      setSavedSkills((prev) =>
        prev.map((skillSet) =>
          skillSet.id === currentEditId ? { ...skillSet, skills: selectedSkills } : skillSet
        )
      );
      setSelectedSkills([]);
      setIsEditing(false);
      setCurrentEditId(null);
    } catch (e) {
      console.error('Error updating document: ', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (skills) => {
    if (!skills || skills.length === 0) return;
    setLoading(true);
    try {
      const courses = await fetchCourseData(skills);
      setCourseData(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen" style={{ marginTop: '10vh' }}>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Skill Selection Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {isEditing ? 'Edit Your Skills' : 'Choose the skills you want to learn'}
          </h2>
          {Object.entries(skillCategories).map(([category, skills]) => (
            <div key={category} className="mb-6">
              <h3 className="text-xl font-medium text-gray-700 mb-2">{category}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {skills.map((skill) => (
                  <label key={skill} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      value={skill}
                      checked={selectedSkills.includes(skill)}
                      onChange={handleSkillChange}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={saveSkillsToFirestore}
            disabled={loading || selectedSkills.length === 0}
            className={`mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              (loading || selectedSkills.length === 0) && 'opacity-50 cursor-not-allowed'
            }`}
          >
            {loading ? 'Saving...' : 'Save Skills'}
          </button>
        </div>

        {/* Saved Skills Section */}
        {savedSkills.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Saved Skills</h2>
            {savedSkills.map((skillSet) => (
              <div key={skillSet.id} className="mb-4 border border-gray-200 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">Skills: {skillSet.skills.join(', ')}</p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedSkills(skillSet.skills);
                      setIsEditing(true);
                      setCurrentEditId(skillSet.id);
                    }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSkillsFromFirestore(skillSet.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => fetchCourses(skillSet.skills)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Find Courses
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Courses Display Section */}
        {courseData.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recommended Learning Resources</h2>
            <div className="space-y-6">
              {courseData.map((course, index) => (
                <div key={index} className="border p-4 rounded-lg bg-gray-50 shadow hover:bg-gray-100">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{course.skill}</h3>
                  <ul className="space-y-2">
                    {course.platforms.map((platform, pIndex) => (
                      <li key={pIndex}>
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {platform.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillSelection;

