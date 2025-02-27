"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"
import SavedSkills from "./SavedSkills"
import "./SkillSelection.css"

const SkillSelection = () => {
  const skillCategories = {
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
};

  const [selectedSkills, setSelectedSkills] = useState([])
  const [savedSkills, setSavedSkills] = useState(null) // Null initially to differentiate between loading & empty
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

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
        const docData = querySnapshot.docs[0] // Only allow 1 entry per user
        setSavedSkills({ id: docData.id, skills: docData.data().skills })
      } else {
        setSavedSkills(null) // No existing skills
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
      const docRef = await addDoc(collection(db, "userSkills"), {
        userId: auth.currentUser.uid,
        skills: selectedSkills,
      })
      setSavedSkills({ id: docRef.id, skills: selectedSkills })
      setSelectedSkills([])
      setIsEditing(false)
    } catch (err) {
      console.error("Error adding document:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="content">
        <div className="card">
          <h2 className="section-title">
            {isEditing ? "Edit Your Skills" : "Choose the skills you want to learn"}
          </h2>

          {loading ? (
            <p>Loading...</p>
          ) : savedSkills ? (
            isEditing ? (
              // Show the selection form with preloaded skills
              <>
                {Object.entries(skillCategories).map(([category, skills]) => (
                  <div key={category} className="category">
                    <h3 className="category-title">{category}</h3>
                    <div className="skills-grid">
                      {skills.map((skill) => (
                        <label key={skill} className="skill-checkbox">
                          <input
                            type="checkbox"
                            value={skill}
                            checked={selectedSkills.includes(skill)}
                            onChange={handleSkillChange}
                          />
                          <span className="skill-label">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={saveSkillsToFirestore} className="button button-primary" disabled={loading || selectedSkills.length === 0}>
                  {loading ? "Saving..." : "Save Skills"}
                </button>
              </>
            ) : (
              <SavedSkills
                savedSkills={[savedSkills]} // Pass as an array
                setSelectedSkills={setSelectedSkills}
                setIsEditing={setIsEditing}
                fetchSavedSkills={fetchSavedSkills}
              />
            )
          ) : (
            // Show skill selection form if no saved skills exist
            <>
              {Object.entries(skillCategories).map(([category, skills]) => (
                <div key={category} className="category">
                  <h3 className="category-title">{category}</h3>
                  <div className="skills-grid">
                    {skills.map((skill) => (
                      <label key={skill} className="skill-checkbox">
                        <input
                          type="checkbox"
                          value={skill}
                          checked={selectedSkills.includes(skill)}
                          onChange={handleSkillChange}
                        />
                        <span className="skill-label">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={saveSkillsToFirestore} className="button button-primary" disabled={loading || selectedSkills.length === 0}>
                {loading ? "Saving..." : "Save Skills"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SkillSelection
