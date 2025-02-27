// Import the necessary Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration object

const firebaseConfig = {
  apiKey: "AIzaSyBPc_hVOBSizkxesJP0IloLYQyxwXdOim0",
  authDomain: "skillsync-583a0.firebaseapp.com",
  projectId: "skillsync-583a0",
  storageBucket: "skillsync-583a0.firebasestorage.app",
  messagingSenderId: "950695607634",
  appId: "1:950695607634:web:c437df0442b3a702b4ce8b",
  measurementId: "G-6XKRCXPZ64"
};
// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication, Firestore Database, and Storage
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Added Firebase Storage

// Export the auth, db, and storage objects
export { auth, db, storage };
