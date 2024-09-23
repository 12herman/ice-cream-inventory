import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs, getDoc } from "firebase/firestore";
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

  // Get delivery by ID
export const getDeliveryById = async (deliveryId) => {
  if (!deliveryId) {
    console.error("Error: deliveryId is undefined or null");
    return { status: 400, message: 'Invalid delivery ID' };
  }

  try {
    const docRef = doc(db, "delivery", deliveryId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return { delivery: { id: docSnapshot.id, ...docSnapshot.data() }, status: 200 };
    } else {
      return { status: 404, message: 'delivery not found' };
    }
  } catch (err) {
    console.error("Error fetching document: ", err);
    return { status: 500, message: err.message };
  }
};

  // get items for delivery
  export const fetchItemsForDelivery = async (deliveryId) => {
    try {
      const itemsCollectionRef = collection(db, 'delivery', deliveryId, 'items');
      const querySnapshot = await getDocs(itemsCollectionRef);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { items, status: 200 };
    } catch (err) {
      console.error("Error fetching items: ", err);
      return { status: 500, message: err.message };
    }
  };


    // get paydetial for delivery
    export const fetchPayDetailsForDelivery = async (deliveryId) => {
      try {
        const payDetialsCollectionRef = collection(db, 'delivery', deliveryId, 'paydetails');
        const querySnapshot = await getDocs(payDetialsCollectionRef);
        const paymenthistory = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { paymenthistory, status: 200 };
      } catch (err) {
        console.error("Error fetching items: ", err);
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

// update paydetils
export const updatePaydetailsChild = async (payId, payDetailId, updatedData) => {
  try {
    const payDetailDocRef = doc(db, 'delivery', payId, 'paydetails', payDetailId);
    await updateDoc(payDetailDocRef, updatedData);
    return { status: 200, message: 'Pay details updated successfully' };
  } catch (err) {
    console.error("Error updating pay details: ", err);
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

  // To get all deliverys from all Delivery
  export const getAllPayDetailsFromAllDelivery = async () => {
    try {
      const DeliveryCollectionRef = collection(db, 'delivery');
      const DeliverySnapshot = await getDocs(DeliveryCollectionRef);
      const alldeliveryDetails = [];
      for (const supplierDoc of DeliverySnapshot.docs) {
        const DeliveryId = supplierDoc.id;
        const DeliveryDetailsRef = collection(db, 'delivery', DeliveryId, 'paydetails');
        const deliveryDetailsSnapshot = await getDocs(DeliveryDetailsRef);
        deliveryDetailsSnapshot.forEach(deliveryDoc => {
          alldeliveryDetails.push({
            DeliveryId,
            deliveryId: deliveryDoc.id,
            ...deliveryDoc.data(),
          });
        });
      }
      return { deliverys: alldeliveryDetails, status: 200 };
    } catch (err) {
      console.error("Error fetching delivery details from all delivery: ", err);
      return { status: 500, message: err.message };
    }
  };

