// hooks/useFirebaseSkills.js
import { useState, useEffect } from 'react';
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
import { auth, db } from '../firebase';

const useFireBaseSkills = () => {
  const [savedSkills, setSavedSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSavedSkills = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error fetching saved skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSkills = async (selectedSkills) => {
    if (selectedSkills.length === 0 || !auth.currentUser) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'userSkills'), {
        userId: auth.currentUser.uid,
        skills: selectedSkills,
      });
      setSavedSkills((prev) => [...prev, { id: docRef.id, skills: selectedSkills }]);
    } catch (error) {
      console.error('Error saving skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSkills = async (id) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'userSkills', id));
      setSavedSkills((prev) => prev.filter((skillSet) => skillSet.id !== id));
    } catch (error) {
      console.error('Error deleting skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSkills = async (id, selectedSkills) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'userSkills', id), {
        skills: selectedSkills,
      });
      setSavedSkills((prev) =>
        prev.map((skillSet) =>
          skillSet.id === id ? { ...skillSet, skills: selectedSkills } : skillSet
        )
      );
    } catch (error) {
      console.error('Error updating skills:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    savedSkills,
    loading,
    fetchSavedSkills,
    saveSkills,
    deleteSkills,
    updateSkills,
  };
};

export default useFireBaseSkills;
