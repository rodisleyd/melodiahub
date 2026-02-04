
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider,
    User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { User } from '../types';

export const authService = {
    login: async (email: string, password: string): Promise<User> => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return mapFirebaseUser(userCredential.user);
    },

    loginWithGoogle: async (): Promise<User> => {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        return mapFirebaseUser(userCredential.user);
    },

    register: async (name: string, email: string, password: string): Promise<User> => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: name
        });
        // Reload user to get the updated profile
        await userCredential.user.reload();
        // Return updated user object
        const updatedUser = auth.currentUser || userCredential.user;
        return mapFirebaseUser(updatedUser);
    },

    logout: async (): Promise<void> => {
        await signOut(auth);
    },

    // Helper to transform Firebase User to our App User
    mapUser: (firebaseUser: FirebaseUser | null): User | null => {
        return mapFirebaseUser(firebaseUser);
    }
};

function mapFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
    if (!firebaseUser) return null;
    return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || undefined
    };
}
