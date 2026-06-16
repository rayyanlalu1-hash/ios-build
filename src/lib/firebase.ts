import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signOut, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, doc, collection, getDocs, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Match } from '../types';
import { initialMatches } from '../data/mockMatches';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Explicitly ensure persistence is enabled so user stays signed in across app/browser/WebView sessions
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Auth persistence failed to initialize:", error);
});

// Standard Operational Error Tracking (conforming to system guidelines)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error detailed telemetry: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Email & Password Authentication handlers supporting typed login and register flows
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
}

// Logout session
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Auth Logout Failure: ', error);
  }
}

// Seed Database helper with correct, precise team details (Brazil vs Morocco only, removing other all)
export async function seedInitialMatchesIfEmpty() {
  try {
    const matchesCol = collection(db, 'matches');
    const snapshot = await getDocs(matchesCol);
    
    // Only seed initial matches if the collection is completely empty
    if (snapshot.empty) {
      console.log('Syncing database: Seeding initial matches...');
      const batch = writeBatch(db);
      
      // Seed ONLY the new initialMatches
      initialMatches.forEach((m) => {
        const docRef = doc(db, 'matches', m.id);
        batch.set(docRef, m);
      });
      
      await batch.commit();

      // Seed standings if empty
      const standingsCol = collection(db, 'standings');
      const standingsSnap = await getDocs(standingsCol);
      if (standingsSnap.empty) {
        const standingsBatch = writeBatch(db);
        const initialStandings = [
          { id: "BRA", name: "Brazil", flag: "🇧🇷", gp: 1, w: 1, d: 0, l: 0, gf: 2, ga: 1, pts: 3 },
          { id: "MAR", name: "Morocco", flag: "🇲🇦", gp: 1, w: 0, d: 0, l: 1, gf: 1, ga: 2, pts: 0 },
          { id: "URU", name: "Uruguay", flag: "🇺🇾", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
          { id: "FRA", name: "France", flag: "🇫🇷", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
          { id: "ARG", name: "Argentina", flag: "🇦🇷", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
          { id: "POR", name: "Portugal", flag: "🇵🇹", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
        ];
        initialStandings.forEach((s) => {
          const docRef = doc(db, 'standings', s.id);
          standingsBatch.set(docRef, s);
        });
        await standingsBatch.commit();
      }

      // Seed global stream config fallback setting
      const settingsRef = doc(db, 'settings', 'config');
      await setDoc(settingsRef, {
        activeMatchId: 'match-1',
        streamUrl: 'https://qp-pldt-live-bpk-ucd-prod.akamaized.net/bpk-tv/ch299/default/index.mpd',
        drmKey: '549ab7cd35a64bb6bb479ecead04d69d:829799ed534d11fcadeb4b192467e050',
        activeCommentaryCode: 'en',
        resolution: 'Auto',
        resolutions: ['Auto', '1080p', '720p', '480p'],
        languages: ['en'],
        commentaryTracks: [
          { code: "en", name: "English commentary", flag: "🇬🇧", channel: "FIFA Network HD • NBC Sports", commentator: "Peter Drury & Jon Champion" },
          { code: "es", name: "Comentario en Español", flag: "🇲🇽", channel: "Telemundo Deportes 4K", commentator: "Andrés Cantor & Manuel Sol" },
          { code: "ar", name: "التعليق العربي", flag: "🇸🇦", channel: "beIN Sports Premium UHD", commentator: "Khalil Al-Balushi" },
          { code: "fr", name: "Commentaire Français", flag: "🇫🇷", channel: "TF1 Live Stream", commentator: "Grégoire Margotton" },
          { code: "pt", name: "Narraçao em Português", flag: "🇧🇷", channel: "SporTV Premium", commentator: "Milton Leite" }
        ]
      }, { merge: true });
    }
  } catch (error) {
    console.error('Database match seeding failed', error);
  }
}

// Check if user has administrative privileges (returns true strictly for ayahakuttyv@gmail.com)
export async function checkUserIsAdmin(uid: string, email: string | null): Promise<boolean> {
  if (!email) return false;
  return email.trim().toLowerCase() === "ayahakuttyv@gmail.com";
}
