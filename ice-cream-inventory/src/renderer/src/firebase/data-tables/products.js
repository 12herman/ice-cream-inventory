import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Get all projects
export const getProjects = async () => {
    try {
      const collectionRef = collection(db, "projects");
      const querySnapshot = await getDocs(collectionRef);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { projects, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  // Create a new projects
export const createProjects = async (task) => {
  try {
    const collectionRef = collection(db, "projects");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing projects
export const updateProjects = async (projectsId, updatedData) => {
  try {
    const docRef = doc(db, "projects", projectsId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};


// Delete an projects
export const deleteProjects = async (projectsId) => {
  try {
    const docRef = doc(db, "projects", projectsId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};
