import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Get all delivery
export const getDelivery = async () => {
    try {
      const collectionRef = collection(db, "delivery");
      const querySnapshot = await getDocs(collectionRef);
      const delivery = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { delivery, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  // Create a new delivery
export const createDelivery = async (task) => {
  try {
    const collectionRef = collection(db, "delivery");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing delivery
export const updateDelivery = async (deliveryId, updatedData) => {
  try {
    const docRef = doc(db, "delivery", deliveryId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};


// Delete an delivery
export const deleteDelivery = async (deliveryId) => {
  try {
    const docRef = doc(db, "delivery", deliveryId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};


