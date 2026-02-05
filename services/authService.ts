import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider,
    User as FirebaseUser,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';

export const authService = {
    login: async (email: string, password: string): Promise<User> => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = await mapFirebaseUser(userCredential.user);
        if (user) await syncUserToFirestore(user);
        return user as User;
    },

    loginWithGoogle: async (): Promise<User> => {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = await mapFirebaseUser(userCredential.user);
        if (user) await syncUserToFirestore(user);
        return user as User;
    },

    register: async (name: string, email: string, password: string): Promise<User> => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: name
        });
        await userCredential.user.reload();
        const updatedUser = auth.currentUser || userCredential.user;
        const user = await mapFirebaseUser(updatedUser);
        if (user) await syncUserToFirestore(user);
        return user as User;
    },

    logout: async (): Promise<void> => {
        await signOut(auth);
    },

    mapUser: async (firebaseUser: FirebaseUser | null): Promise<User | null> => {
        return await mapFirebaseUser(firebaseUser);
    },

    updateUserProfile: async (user: User, updates: { name?: string; avatar?: string; }): Promise<User> => {
        if (!auth.currentUser) throw new Error("No user logged in");

        // Update Firebase Auth
        await updateProfile(auth.currentUser, {
            displayName: updates.name || user.name,
            photoURL: updates.avatar || user.avatar
        });

        // Update Firestore
        const updatedUser = { ...user, ...updates };
        await syncUserToFirestore(updatedUser);

        return updatedUser;
    }
};

async function syncUserToFirestore(user: User) {
    try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, {
            email: user.email,
            name: user.name,
            avatar: user.avatar || null,
        }, { merge: true });
    } catch (e) {
        console.error("Error syncing user to Firestore:", e);
    }
}

async function mapFirebaseUser(firebaseUser: FirebaseUser | null): Promise<User | null> {
    if (!firebaseUser) return null;

    let role: 'user' | 'admin' = 'user';

    try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.role) {
                role = userData.role;
            }
        }
        // Hardcode admin for specific email if needed, or dev mode override
        // if (firebaseUser.email === 'admin@melodiahub.com') role = 'admin';
    } catch (e) {
        console.error("Error fetching user role:", e);
    }

    return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || undefined,
        role
    };
}
