import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import Loader from '../components/common/Loader';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        unsubscribeDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // Auto-create profile for existing/legacy users
            const newUserData = { 
              email: currentUser.email,
              status: 'pending', 
              createdAt: serverTimestamp() 
            };
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
          }
          setUser(currentUser);
          setLoading(false);
        });
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setUserData(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    
    // Check if user doc exists, if not create it
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    }
    return res;
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    userData,
    login,
    register,
    logout,
    loginWithGoogle,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loader /> : children}
    </AuthContext.Provider>
  );
};
