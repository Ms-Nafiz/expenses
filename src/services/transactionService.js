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
  serverTimestamp,
  getDocs,
  writeBatch
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

export const renameTransactionCategory = async (userId, oldCategory, newCategory) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      where("category", "==", oldCategory)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.forEach((docSnap) => {
      const docRef = doc(db, COLLECTION_NAME, docSnap.id);
      batch.update(docRef, { category: newCategory });
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error renaming transactions category: ", error);
    throw error;
  }
};

// --- Budget Service ---
const BUDGETS_COLLECTION = "budgets";

export const addBudget = async (userId, category, limitAmount) => {
  try {
    return await addDoc(collection(db, BUDGETS_COLLECTION), {
      userId,
      category,
      limitAmount: parseFloat(limitAmount),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding budget: ", error);
    throw error;
  }
};

export const updateBudget = async (budgetId, limitAmount) => {
  try {
    const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);
    await updateDoc(budgetRef, {
      limitAmount: parseFloat(limitAmount),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating budget: ", error);
    throw error;
  }
};

export const deleteBudget = async (budgetId) => {
  try {
    await deleteDoc(doc(db, BUDGETS_COLLECTION, budgetId));
  } catch (error) {
    console.error("Error deleting budget: ", error);
    throw error;
  }
};

export const subscribeToBudgets = (userId, callback) => {
  const q = query(
    collection(db, BUDGETS_COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const budgets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(budgets);
  });
};

// --- Goals Service ---
const GOALS_COLLECTION = "goals";

export const addGoal = async (userId, goalData) => {
  try {
    return await addDoc(collection(db, GOALS_COLLECTION), {
      ...goalData,
      userId,
      savedAmount: parseFloat(goalData.savedAmount) || 0,
      targetAmount: parseFloat(goalData.targetAmount),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding goal: ", error);
    throw error;
  }
};

export const updateGoal = async (goalId, goalData) => {
  try {
    const goalRef = doc(db, GOALS_COLLECTION, goalId);
    await updateDoc(goalRef, {
      ...goalData,
      savedAmount: parseFloat(goalData.savedAmount) || 0,
      targetAmount: parseFloat(goalData.targetAmount),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating goal: ", error);
    throw error;
  }
};

export const deleteGoal = async (goalId) => {
  try {
    await deleteDoc(doc(db, GOALS_COLLECTION, goalId));
  } catch (error) {
    console.error("Error deleting goal: ", error);
    throw error;
  }
};

export const subscribeToGoals = (userId, callback) => {
  const q = query(
    collection(db, GOALS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(goals);
  });
};

// --- Recurring Setup Service ---
const RECURRING_COLLECTION = "recurring_configs";

export const addRecurringConfig = async (userId, configData) => {
  try {
    return await addDoc(collection(db, RECURRING_COLLECTION), {
      ...configData,
      userId,
      amount: parseFloat(configData.amount),
      dayOfMonth: parseInt(configData.dayOfMonth),
      lastProcessedMonth: "", // initially not processed
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding recurring config: ", error);
    throw error;
  }
};

export const deleteRecurringConfig = async (configId) => {
  try {
    await deleteDoc(doc(db, RECURRING_COLLECTION, configId));
  } catch (error) {
    console.error("Error deleting recurring config: ", error);
    throw error;
  }
};

export const subscribeToRecurringConfigs = (userId, callback) => {
  const q = query(
    collection(db, RECURRING_COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const configs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(configs);
  });
};

export const updateRecurringLastProcessed = async (configId, monthStr) => {
  try {
    const docRef = doc(db, RECURRING_COLLECTION, configId);
    await updateDoc(docRef, {
      lastProcessedMonth: monthStr
    });
  } catch (error) {
    console.error("Error updating recurring processed month: ", error);
    throw error;
  }
};
