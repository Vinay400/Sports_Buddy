import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const signup = async (email, password, firstName, lastName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(result.user, {
        displayName: `${firstName} ${lastName}`,
      });

      await setDoc(doc(db, 'users', result.user.uid), {
        firstName,
        lastName,
        email,
        createdAt: new Date(),
        profileComplete: false,
        activitiesJoined: 0,
        activitiesCreated: 0,
        rating: 4.5,
      });

      return { user: result.user };
    } catch (error) {
      return { error: error.code };
    }
  };

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user };
    } catch (error) {
      return { error: error.code };
    }
  };

  const logout = () => signOut(auth);

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { error: error.code };
    }
  };

  const signInWithProvider = async (provider) => {
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);

      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        const names = result.user.displayName?.split(' ') || ['', ''];
        await setDoc(doc(db, 'users', result.user.uid), {
          firstName: names[0],
          lastName: names.slice(1).join(' '),
          email: result.user.email,
          createdAt: new Date(),
          profileComplete: false,
          activitiesJoined: 0,
          activitiesCreated: 0,
          rating: 4.5,
        });
      }

      return { user: result.user };
    } catch (error) {
      return { error: error.code };
    }
  };

  // ✅ FIX: Wrapped fetchUserProfile in useCallback so its reference is stable.
  // Previously, including it in the useEffect dependency array below (as ESLint
  // would require) would cause an infinite loop because a new function reference
  // was created on every render. With useCallback it's created once and reused.
  const fetchUserProfile = useCallback(async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data();
        setUserProfile(profile);
        return profile;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []); // No external dependencies — db and doc are module-level imports

  useEffect(() => {
    // ✅ FIX (continued): fetchUserProfile is now safe to include here as a
    // dependency because useCallback gives it a stable reference. Previously
    // it was omitted from the dependency array (an ESLint exhaustive-deps
    // violation) to avoid the infinite loop — now both issues are resolved.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchUserProfile]);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    signInWithProvider,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};