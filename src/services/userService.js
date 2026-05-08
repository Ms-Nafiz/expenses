import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'users';

export const subscribeToAllUsers = (callback) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(users);
  });
};

export const updateUserStatus = async (userId, newStatus) => {
  const userRef = doc(db, COLLECTION_NAME, userId);
  return await updateDoc(userRef, {
    status: newStatus
  });
};

export const updateUserRole = async (userId, newRole) => {
  const userRef = doc(db, COLLECTION_NAME, userId);
  return await updateDoc(userRef, {
    role: newRole
  });
};
