import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION_NAME = "transactions";

export const addTransaction = async (userId, transactionData) => {
  try {
    return await addDoc(collection(db, COLLECTION_NAME), {
      ...transactionData,
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding transaction: ", error);
    throw error;
  }
};

export const updateTransaction = async (transactionId, transactionData) => {
  try {
    const transactionRef = doc(db, COLLECTION_NAME, transactionId);
    await updateDoc(transactionRef, {
      ...transactionData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating transaction: ", error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, transactionId));
  } catch (error) {
    console.error("Error deleting transaction: ", error);
    throw error;
  }
};

export const subscribeToTransactions = (userId, callback) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(transactions);
  });
};
