"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { auth, db } from "../firebase"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"
import SavedSkills from "./SavedSkills"
import "./SkillSelection.css"

const SkillSelection = () => {
  // Memoize the skillCategories object to prevent recreation on every render
  const skillCategories = useMemo(() => ({
    "Programming Languages": [
        "JavaScript", "Python", "Java", "C", "C++", "Ruby", "Go", "Swift", "Rust", "PHP", 
        "TypeScript", "Kotlin", "Dart", "Scala", "Perl", "Haskell"
    ],
    "Web Development": [
        "React", "Vue.js", "Angular", "HTML", "CSS", "Node.js", "Bootstrap", "Tailwind CSS", 
        "Next.js", "Svelte", "Django", "Flask", "Express.js", "ASP.NET"
    ],
    "Data Science": [
        "Python", "R", "TensorFlow", "Keras", "PyTorch", "Pandas", "Machine Learning", 
        "Scikit-learn", "Matplotlib", "Seaborn", "NumPy", "Deep Learning", "Data Visualization"
    ],
    "DevOps": [
        "Docker", "Kubernetes", "AWS", "Azure", "CI/CD", "Terraform", "Ansible", "Jenkins", 
        "Prometheus", "Grafana", "Bash Scripting", "Helm", "GitOps", "OpenShift"
    ],
    "Databases": [
        "MySQL", "PostgreSQL", "MongoDB", "Firebase", "SQLite", "Redis", "Cassandra", "OracleDB", 
        "MariaDB", "DynamoDB", "Neo4j", "CouchDB"
    ],
    "Version Control": [
        "Git", "GitHub", "GitLab", "Bitbucket", "SVN", "Mercurial"
    ],
    "Cloud Platforms": [
        "AWS", "GCP", "Azure", "IBM Cloud", "DigitalOcean", "Heroku", "Oracle Cloud"
    ],
    "Cybersecurity": [
        "Ethical Hacking", "Penetration Testing", "Cryptography", "Wireshark", "Metasploit", 
        "Nmap", "Burp Suite", "SOC Analysis", "Incident Response"
    ],
    "Mobile Development": [
        "Flutter", "React Native", "Swift", "Kotlin", "Dart", "Jetpack Compose", "Xamarin"
    ],
    "Game Development": [
        "Unity", "Unreal Engine", "Godot", "C#", "C++", "Blender", "Game Physics", "3D Modeling"
    ],
    "Blockchain": [
        "Solidity", "Ethereum", "Hyperledger", "Smart Contracts", "Web3.js", "NFT Development"
    ],
    "UI/UX Design": [
        "Figma", "Adobe XD", "Sketch", "Wireframing", "Prototyping", "User Research"
    ],
    "Networking": [
        "Cisco", "CCNA", "Network Security", "VPN", "Firewalls", "TCP/IP", "BGP", "Routing & Switching"
    ]
  }), []); // Empty dependency array since this is a static object

  const [selectedSkills, setSelectedSkills] = useState([])
  const [savedSkills, setSavedSkills] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const searchInputRef = useRef(null);
  const categoryButtonsRef = useRef([]);
  const skillCheckboxesRef = useRef([]);

  // Focus management
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Memoize the handleKeyDown function to prevent recreation on every render
  const handleKeyDown = useMemo(() => (e, type, index) => {
    switch (type) {
      case 'search':
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          categoryButtonsRef.current[0]?.focus();
        }
        break;
      
      case 'category':
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIndex = (index + 1) % categoryButtonsRef.current.length;
          categoryButtonsRef.current[nextIndex]?.focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIndex = (index - 1 + categoryButtonsRef.current.length) % categoryButtonsRef.current.length;
          categoryButtonsRef.current[prevIndex]?.focus();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const firstSkillCheckbox = skillCheckboxesRef.current[0];
          if (firstSkillCheckbox) {
            firstSkillCheckbox.focus();
          }
        }
        break;
      
      case 'skill':
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (index + 1) % skillCheckboxesRef.current.length;
          skillCheckboxesRef.current[nextIndex]?.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = (index - 1 + skillCheckboxesRef.current.length) % skillCheckboxesRef.current.length;
          skillCheckboxesRef.current[prevIndex]?.focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const checkbox = e.target.querySelector('input[type="checkbox"]');
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            handleSkillChange({ target: checkbox });
          }
        }
        break;
      default:
        // Handle any other key presses if needed
        break;
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Memoize filtered skills to prevent unnecessary recalculations
  const filteredSkills = useMemo(() => {
    return Object.entries(skillCategories).reduce((acc, [category, skills]) => {
      const filteredCategorySkills = skills.filter(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === 'all' || category === selectedCategory)
      );
      
      if (filteredCategorySkills.length > 0) {
        acc[category] = filteredCategorySkills;
      }
      return acc;
    }, {});
  }, [searchTerm, selectedCategory, skillCategories]);

  // Update the categoryButtons useMemo to include handleKeyDown in its dependencies
  const categoryButtons = useMemo(() => (
    <div className="category-buttons" role="group" aria-label="Skill categories">
      <button
        className={`category-button ${selectedCategory === 'all' ? 'active' : ''}`}
        onClick={() => setSelectedCategory('all')}
        ref={el => categoryButtonsRef.current[0] = el}
        onKeyDown={(e) => handleKeyDown(e, 'category', 0)}
      >
        All Categories
      </button>
      {Object.keys(skillCategories).map((category, index) => (
        <button
          key={category}
          className={`category-button ${selectedCategory === category ? 'active' : ''}`}
          onClick={() => setSelectedCategory(category)}
          ref={el => categoryButtonsRef.current[index + 1] = el}
          onKeyDown={(e) => handleKeyDown(e, 'category', index + 1)}
        >
          {category}
        </button>
      ))}
    </div>
  ), [selectedCategory, skillCategories, handleKeyDown]);

  useEffect(() => {
    if (auth.currentUser) {
      fetchSavedSkills()
    }
  }, [])

  const fetchSavedSkills = async () => {
    if (!auth.currentUser) return
    setLoading(true)

    try {
      const userSkillsQuery = query(collection(db, "userSkills"), where("userId", "==", auth.currentUser.uid))
      const querySnapshot = await getDocs(userSkillsQuery)

      if (!querySnapshot.empty) {
        // If multiple documents exist, delete all but the first one
        if (querySnapshot.docs.length > 1) {
          const docsToDelete = querySnapshot.docs.slice(1)
          for (const doc of docsToDelete) {
            await deleteDoc(doc.ref)
          }
        }
        
        const docData = querySnapshot.docs[0]
        setSavedSkills({ id: docData.id, skills: docData.data().skills })
        setSelectedSkills(docData.data().skills)
      } else {
        setSavedSkills(null)
        setSelectedSkills([])
      }
    } catch (err) {
      console.error("Error fetching saved skills:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSkillChange = (event) => {
    const skill = event.target.value
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const saveSkillsToFirestore = async () => {
    if (selectedSkills.length === 0 || !auth.currentUser) return
    setLoading(true)

    try {
      // First, check if user already has a skills document
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

      setSelectedSkills([])
      setIsEditing(false)
    } catch (err) {
      console.error("Error saving skills:", err)
    } finally {
      setLoading(false)
    }
  }

  const renderSkillCheckboxes = (skills) => (
    <div className="skills-grid" role="group" aria-label="Skills selection">
      {skills.map((skill, index) => (
        <label 
          key={skill} 
          className="skill-checkbox"
          tabIndex={0}
          ref={el => skillCheckboxesRef.current[index] = el}
          onKeyDown={(e) => handleKeyDown(e, 'skill', index)}
        >
          <input
            type="checkbox"
            value={skill}
            checked={selectedSkills.includes(skill)}
            onChange={handleSkillChange}
            aria-label={`Select ${skill}`}
          />
          <span className="skill-label">{skill}</span>
        </label>
      ))}
    </div>
  );

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
      <>
        {Object.entries(filteredSkills).map(([category, skills]) => (
          <div key={category} className="category" role="region" aria-label={category}>
            <h3 className="category-title">{category}</h3>
            {renderSkillCheckboxes(skills)}
          </div>
        ))}
        <button 
          onClick={saveSkillsToFirestore} 
          className="button button-primary" 
          disabled={loading || selectedSkills.length === 0}
          aria-label="Save selected skills"
        >
          {loading ? "Saving..." : "Save Skills"}
        </button>
      </>
    );
  };

  return (
    <div className="container" role="main">
      <div className="content">
        <div className="card">
          <h2 className="section-title">
            {isEditing ? "Edit Your Skills" : "Choose the skills you want to learn"}
          </h2>

          <div className="search-filter-section" role="search">
            <div className="search-container">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                aria-label="Search skills"
                onKeyDown={(e) => handleKeyDown(e, 'search', 0)}
              />
            </div>
            
            <div className="category-filter" role="tablist" aria-label="Skill categories">
              {categoryButtons}
            </div>
          </div>

          {renderSkillsSection()}
        </div>
      </div>
    </div>
  );
};

export default SkillSelection;
