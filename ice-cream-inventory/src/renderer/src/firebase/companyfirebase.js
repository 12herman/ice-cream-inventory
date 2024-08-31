import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfigDate = {
  apiKey: "AIzaSyAwUi2QrllSi_8szzypanMrfs0asbgfbnM",
  authDomain: "new-saranya-ice-creams.firebaseapp.com",
  projectId: "new-saranya-ice-creams",
  storageBucket: "new-saranya-ice-creams.appspot.com",
  messagingSenderId: "598800808443",
  appId: "1:598800808443:web:58597e732f77b8c105335e"
};

const dateApp = initializeApp(firebaseConfigDate, 'dateApp')
const dateAuth = getAuth(dateApp)
signInAnonymously(dateAuth).catch((error) => {
  console.error('Date Authentication error:', error)
})
const datedb = getFirestore(dateApp)

export const getDate = async () => {
  try {
    const collectionRef = collection(datedb, 'expiry')
    const querySnapshot = await getDocs(collectionRef)
    const expirydata = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    return { expirydata, status: 200 }
  } catch (err) {
    console.error('Error fetching documents: ', err)
    return { status: 500, message: err.message }
  }
}