
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    QuerySnapshot,
    DocumentData,
    runTransaction,
    increment,
    getDoc
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { Album, Playlist } from '../types';

const ALBUMS_COLLECTION = 'albums';
const PLAYLISTS_COLLECTION = 'playlists';

export const dbService = {
    // Albums
    getAlbums: async (): Promise<Album[]> => {
        const querySnapshot = await getDocs(collection(db, ALBUMS_COLLECTION));
        return mapQuerySnapshotToAlbums(querySnapshot);
    },

    subscribeToAlbums: (callback: (albums: Album[]) => void) => {
        const unsubscribe = onSnapshot(collection(db, ALBUMS_COLLECTION), (snapshot) => {
            const albums = mapQuerySnapshotToAlbums(snapshot);
            callback(albums);
        });
        return unsubscribe;
    },

    addAlbum: async (album: Omit<Album, 'id'>): Promise<string> => {
        // We allow omitting ID because Firestore generates one
        const docRef = await addDoc(collection(db, ALBUMS_COLLECTION), album);
        return docRef.id;
    },

    updateAlbum: async (album: Album): Promise<void> => {
        const albumRef = doc(db, ALBUMS_COLLECTION, album.id);
        const { id, ...data } = album; // Remove ID from data payload
        await updateDoc(albumRef, data);
    },

    deleteAlbum: async (albumId: string): Promise<void> => {
        await deleteDoc(doc(db, ALBUMS_COLLECTION, albumId));
    },

    // Playlists
    getPlaylists: async (): Promise<Playlist[]> => {
        const querySnapshot = await getDocs(collection(db, PLAYLISTS_COLLECTION));
        return mapQuerySnapshotToPlaylists(querySnapshot);
    },

    subscribeToPlaylists: (callback: (playlists: Playlist[]) => void) => {
        const unsubscribe = onSnapshot(collection(db, PLAYLISTS_COLLECTION), (snapshot) => {
            const playlists = mapQuerySnapshotToPlaylists(snapshot);
            callback(playlists);
        });
        return unsubscribe;
    },

    addPlaylist: async (playlist: Omit<Playlist, 'id'>): Promise<string> => {
        const docRef = await addDoc(collection(db, PLAYLISTS_COLLECTION), playlist);
        return docRef.id;
    },

    updatePlaylist: async (playlist: Playlist): Promise<void> => {
        const playlistRef = doc(db, PLAYLISTS_COLLECTION, playlist.id);
        const { id, ...data } = playlist;
        await updateDoc(playlistRef, data);
    },

    deletePlaylist: async (playlistId: string): Promise<void> => {
        await deleteDoc(doc(db, PLAYLISTS_COLLECTION, playlistId));
    },

    // Storage
    uploadFile: async (file: File, path: string): Promise<string> => {
        const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    },

    // Stats & Ranking
    incrementPlayCount: async (albumId: string, trackId: string): Promise<void> => {
        try {
            const albumRef = doc(db, ALBUMS_COLLECTION, albumId);
            const statsRef = doc(db, 'stats', 'global');

            await runTransaction(db, async (transaction) => {
                const albumDoc = await transaction.get(albumRef);
                if (!albumDoc.exists()) throw "Album does not exist!";

                const albumData = albumDoc.data() as Album;
                const newTracks = albumData.tracks.map(t => {
                    if (t.id === trackId) {
                        return { ...t, playCount: (t.playCount || 0) + 1 };
                    }
                    return t;
                });

                // Increment Album Play Count
                const newAlbumPlayCount = (albumData.playCount || 0) + 1;

                transaction.update(albumRef, {
                    tracks: newTracks,
                    playCount: newAlbumPlayCount
                });

                // Increment Global Stats
                transaction.set(statsRef, {
                    totalPlays: increment(1)
                }, { merge: true });
            });
        } catch (e) {
            console.error("Error incrementing play count: ", e);
        }
    },

    getStats: async (): Promise<{ totalUsers: number, totalPlays: number, totalAlbums: number }> => {
        const statsRef = doc(db, 'stats', 'global');
        const statsSnap = await getDoc(statsRef);

        const albumsSnap = await getDocs(collection(db, ALBUMS_COLLECTION));
        const usersSnap = await getDocs(collection(db, 'users'));

        return {
            totalPlays: statsSnap.exists() ? statsSnap.data().totalPlays || 0 : 0,
            totalAlbums: albumsSnap.size,
            totalUsers: usersSnap.size
        };
    },

    // User Management
    updateUserRole: async (userId: string, role: 'user' | 'admin'): Promise<void> => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role });
    },

    getAllUsers: async (): Promise<any[]> => {
        const querySnapshot = await getDocs(collection(db, 'users'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

// Helper to map Firestore snapshot to Album array
const mapQuerySnapshotToAlbums = (snapshot: QuerySnapshot<DocumentData>): Album[] => {
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Album));
};

const mapQuerySnapshotToPlaylists = (snapshot: QuerySnapshot<DocumentData>): Playlist[] => {
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Playlist));
};
