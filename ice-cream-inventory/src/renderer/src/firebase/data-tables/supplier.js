import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Get all supplier
export const getSupplier = async () => {
    try {
      const collectionRef = collection(db, "supplier");
      const querySnapshot = await getDocs(collectionRef);
      const supplier = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { supplier, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  // Get Supplier by ID
export const getSupplierById = async (supplierId) => {
  try {
    const docRef = doc(db, "supplier", supplierId); // Reference to the specific document
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
      return { supplier: { id: docSnapshot.id, ...docSnapshot.data() }, status: 200 };
    } else {
      return { status: 404, message: 'supplier not found' };
    }
  } catch (err) {
    console.error("Error fetching document: ", err);
    return { status: 500, message: err.message };
  }
};

  // Create a new supplier
export const createSupplier = async (task) => {
  try {
    const collectionRef = collection(db, "supplier");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing supplier
export const updateSupplier = async (supplierId, updatedData) => {
  try {
    const docRef = doc(db, "supplier", supplierId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};


// Delete an supplier
export const deleteSupplier = async (supplierId) => {
  try {
    const docRef = doc(db, "supplier", supplierId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};
