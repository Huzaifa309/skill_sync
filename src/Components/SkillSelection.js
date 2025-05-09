import { useState, useEffect, useMemo, useRef } from "react"
import { auth, db } from "../firebase"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import SavedSkills from "./SavedSkills"
import "./SkillSelection.css"

const SkillSelection = () => {
  // Memoize the skillCategories object to prevent recreation on every render
  const skillCategories = useMemo(() => ({
    "Programming Languages": [
      "Ada", "Agda", "Assembly", "ATS", "AWK", "Ballerina", "Bash", "Bosque", "C", "C#", "C++", 
      "Chisel", "Clojure", "COBOL", "Crystal", "Dart", "Datalog", "Elixir", "Erlang", "F#", 
      "Forth", "Fortran", "F#", "Gleam", "Go", "Hack", "Haskell", "HTML", "Idris", "Io", 
      "Java", "JavaScript", "Janet", "Julia", "Kotlin", "LaTeX", "LESS", "Lisp", "Lua", 
      "Markdown", "MATLAB", "MoonScript", "Nim", "NoSQL", "Objective-C", "OCaml", "Perl", 
      "PHP", "Pony", "PowerShell", "Prolog", "Python", "R", "Racket", "ReasonML", "Red", 
      "ReScript", "Ruby", "Rust", "SASS", "Scala", "Scheme", "SED", "Shell Scripting", 
      "SML", "SQL", "SPARQL", "Swift", "SystemVerilog", "Tcl", "TypeScript", "Vala", 
      "Verilog", "VHDL", "XML", "YAML", "Zig", "Zsh"
    ],
    "Web Development": [
      "AJAX", "Alpine.js", "Angular", "ASP.NET", "Astro", "Bootstrap", "Canvas API", 
      "Chakra UI", "CSS", "D3.js", "Django", "Dojo", "EJS", "Eleventy", "Ember.js", 
      "Express.js", "Flask", "Gatsby", "Gridsome", "Handlebars", "HTML", "HTMX", 
      "Hugo", "jQuery", "Jekyll", "Liquid", "Lit", "Marko", "Material UI", "Mithril.js", 
      "Next.js", "Node.js", "Nuxt.js", "Parcel", "Pug", "Qwik", "React", "Remix", 
      "Serverless", "SolidJS", "Stencil.js", "Svelte", "Tailwind CSS", "Tauri", 
      "Three.js", "Vite", "Vue.js", "Web Components", "WebGL", "WebGPU", "Windi CSS", 
      "Wix Velo"
    ],
    "Data Science": [
      "AllenNLP", "Altair", "AutoML", "BERT", "BigML", "Bokeh", "Cartopy", "CatBoost", 
      "ClearML", "CNTK", "cuDF", "D-Wave", "Dash", "DataFusion", "Dataiku", "DataRobot", 
      "Data Visualization", "Datashader", "Datatable", "Deep Learning", "DVC", "Edge AI", 
      "Evidently", "FAISS", "Feast", "Geopandas", "GPT", "Great Expectations", "H2O.ai", 
      "Haystack", "JAX", "Keras", "Koalas", "LangChain", "LightGBM", "Machine Learning", 
      "Matplotlib", "MediaPipe", "MLflow", "MXNet", "NetworkX", "Neptune.ai", "NLTK", 
      "NumPy", "ONNX", "OpenCV", "Pandas", "Panel", "Pinecone", "Plotly", "Polars", 
      "PyTorch", "Python", "Qiskit", "Quantum Computing", "R", "RAG", "Raphtory", 
      "Rapids.ai", "Reinforcement Learning", "RoBERTa", "Scikit-learn", "Seaborn", 
      "Sentence-BERT", "spaCy", "Stanza", "T5", "TensorFlow", "Theano", "TinyML", 
      "TPOT", "Transformers", "Vaex", "Weights & Biases", "WhyLogs", "XGBoost"
    ],
    "DevOps": [
      "Ansible", "ArgoCD", "Azure", "AWS", "Bash Scripting", "Buddy", "BuildKit", 
      "Buildpacks", "Calico", "Chef", "Cilium", "CircleCI", "Cloud Native Buildpacks", 
      "CloudFormation", "Crossplane", "Datadog", "DevSpace", "Docker", "Drone", 
      "Earthly", "ELK", "Fluentd", "GitHub Actions", "GitLab CI", "GitOps", "Grafana", 
      "Harbor", "Helm", "Istio", "Jenkins", "Kibana", "Knative", "Kubernetes", 
      "Kustomize", "Linkerd", "Logstash", "Longhorn", "Minikube", "New Relic", 
      "NixOps", "OpenShift", "OpenTelemetry", "Portainer", "Prometheus", "Pulumi", 
      "Puppet", "Rancher", "SaltStack", "Sentry", "Skaffold", "Skupper", "Spinnaker", 
      "Splunk", "TeamCity", "Tekton", "Terraform", "Tilt", "Travis CI", "Weave"
    ],
    "Databases": [
      "Airbyte", "Apache Pinot", "ArangoDB", "Beam", "BigQuery", "Bigtable", "CouchDB", 
      "CrateDB", "Databricks", "Delta Lake", "Dremio", "DuckDB", "DynamoDB", "EdgeDB", 
      "ETL", "Flink", "Firebase", "Firebolt", "Firestore", "GraphDB", "Hadoop", 
      "HBase", "Hive", "InfluxDB", "Kafka", "LevelDB", "LMDB", "MariaDB", "Materialize", 
      "MongoDB", "MySQL", "Neo4j", "NiFi", "OpenSearch", "OracleDB", "Pig", "PlanetScale", 
      "PostgreSQL", "Presto", "Pulsar", "QuestDB", "Redis", "RethinkDB", "RocksDB", 
      "SingleStore", "Snowflake", "Spark", "SQLite", "Storm", "SurrealDB", "Timescale", 
      "TimescaleDB", "Trino", "Turso", "VictoriaMetrics", "Vitess", "Zookeeper"
    ],
    "Version Control": [
      "Bazaar", "Bitbucket", "CVS", "Fossil", "Git", "GitHub", "GitLab", "Mercurial", 
      "Monotone", "Perforce", "SourceTree", "SVN"
    ],
    "Cloud Platforms": [
      "Alibaba Cloud", "Appwrite", "AWS", "Azure", "Azure ML", "Bunnyshell", "Cloudflare", 
      "Deta", "DigitalOcean", "Fly.io", "GCP", "Glitch", "Heroku", "IBM Cloud", 
      "Koyeb", "Netlify", "Oracle Cloud", "Railway", "Replit", "Render", "SageMaker", 
      "Supabase", "Tailscale", "Upstash", "Vercel", "Vertex AI", "Wasmer"
    ],
    "Cybersecurity": [
      "AlienVault", "Atomic Red Team", "Autopsy", "Burp Suite", "Cortex XSOAR", 
      "Cuckoo Sandbox", "CyberChef", "Cryptography", "ClamAV", "Ethical Hacking", 
      "Firewall Configuration", "GDPR", "Ghidra", "HIPAA", "Incident Response", 
      "ISO 27001", "JWT", "Kismet", "MITM Proxy", "MITRE ATT&CK", "NIST", "Nmap", 
      "OpenVAS", "OWASP", "PCI-DSS", "Penetration Testing", "Radare2", "SAML", 
      "Secure Coding", "SIEM", "Sigma Rules", "SOC Analysis", "SOAR", "SSL", 
      "Threat Modeling", "TLS", "Vulnerability Scanning", "VPN", "Wireshark", 
      "YARA", "Zeek"
    ],
    "Mobile Development": [
      "Adalo", "AppGyver", "Capacitor", "Corona SDK", "Cordova", "Dart", "Flutter", 
      "Ionic", "Jetpack Compose", "Kivy", "Kodular", "Kotlin", "MoSync", "NativeScript", 
      "React Native", "Sencha", "Swift", "SwiftUI", "Thunkable", "Xamarin"
    ],
    "Game Development": [
      "Amethyst", "ARKit", "ARCore", "Augmented Reality", "Babylon.js", "Bevy", 
      "Blender", "C#", "C++", "Cocos2d", "Construct", "CryEngine", "Game Physics", 
      "GameMaker", "GDevelop", "Godot", "LibGDX", "LÖVE", "Metaverse", "MonoGame", 
      "Phaser", "PICO-8", "SceneKit", "SpriteKit", "TIC-80", "Three.js", "Unity", 
      "Unreal Engine", "Virtual Reality", "WebXR"
    ],
    "Blockchain": [
      "Alchemy", "Chainlink", "Ethers.js", "Ethereum", "Flow", "Foundry", "Hardhat", 
      "Hyperledger", "Infura", "IPFS", "Moralis", "Near Protocol", "NFT Development", 
      "OpenZeppelin", "Smart Contracts", "Solidity", "Tezos", "The Graph", "Truffle", 
      "WAGMI", "Web3.js"
    ],
    "UI/UX Design": [
      "A/B Testing", "Accessibility Guidelines (WCAG)", "Accessibility Testing", 
      "Adobe XD", "Atomic Design", "Balsamiq", "Crazy Egg", "Design Systems", 
      "Design Tokens", "Eye Tracking", "Figma", "Framer", "FullStory", "Heuristic Evaluation", 
      "Heatmaps", "InVision", "Lookback", "Marvel App", "Maze", "Optimal Workshop", 
      "Prototyping", "Session Replay", "Sketch", "User Research", "User Testing", 
      "UXCam", "UXPin", "Wireframing", "Zeplin"
    ],
    "Networking": [
      "Aircrack-ng", "BGP", "Cacti", "Cisco", "Cisco Packet Tracer", "DHCP", "DNS", 
      "Ettercap", "Ethtool", "Firewalld", "Firewalls", "ICMP", "Iperf", "IPRoute2", 
      "IPSec", "Iptables", "Kerberos", "Kismet", "LAN Topologies", "LDAP", "Linux", 
      "macOS", "Nagios", "Netcat", "Netplan", "Ntopng", "Observium", "OpenWRT", 
      "OPNsense", "pfSense", "RADIUS", "Routing & Switching", "RTOS", "SNMP", 
      "TCP/IP", "TCPDump", "Tinc", "Traceroute", "UNIX", "VPN", "WiFi Pineapple", 
      "Windows Server", "Wireshark CLI", "Zabbix", "ZeroTier"
    ]
  }), []);

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
      // First try to get skills from userSkills collection
      const userSkillsQuery = query(collection(db, "userSkills"), where("userId", "==", auth.currentUser.uid))
      const querySnapshot = await getDocs(userSkillsQuery)

      // Then get the user's profile to check skillsToAcquire
      const userProfileRef = doc(db, "users", auth.currentUser.uid)
      const userProfileSnap = await getDoc(userProfileRef)
      
      let skills = []
      
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
        skills = Array.isArray(profileSkills) ? profileSkills : profileSkills.split(',').map(s => s.trim())
        
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

      // Update user's profile document
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