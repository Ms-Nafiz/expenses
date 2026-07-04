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

export const updateUserCategories = async (userId, newCategories) => {
  const userRef = doc(db, COLLECTION_NAME, userId);
  return await updateDoc(userRef, {
    categories: newCategories
  });
};

export const updateUserBudgets = async (userId, budgets) => {
  const userRef = doc(db, COLLECTION_NAME, userId);
  return await updateDoc(userRef, { budgets });
};

export const updateUserGoals = async (userId, goals) => {
  const userRef = doc(db, COLLECTION_NAME, userId);
  return await updateDoc(userRef, { goals });
};

export const updateUserRecurringConfigs = async (userId, recurringConfigs) => {
  const userRef = doc(db, COLLECTION_NAME, userId);
  return await updateDoc(userRef, { recurringConfigs });
};
