import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Get all usedmaterial
export const getUsedmaterial = async () => {
    try {
      const collectionRef = collection(db, "usedmaterial");
      const querySnapshot = await getDocs(collectionRef);
      const usedmaterial = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { usedmaterial, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  // Create a new usedmaterial
export const createUsedmaterial = async (task) => {
  try {
    const collectionRef = collection(db, "usedmaterial");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing usedmaterial
export const updateUsedmaterial = async (usedmaterialId, updatedData) => {
  try {
    const docRef = doc(db, "usedmaterial", usedmaterialId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};


// Delete an usedmaterial
export const deleteUsedmaterial = async (usedmaterialId) => {
  try {
    const docRef = doc(db, "usedmaterial", usedmaterialId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};
