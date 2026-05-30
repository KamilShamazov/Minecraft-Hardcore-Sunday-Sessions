import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

let dbInstance: any = null;
let authInstance: any = null;
let isFirebaseActive = false;

// Determine if we have real credentials
const hasCredentials = 
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "";

if (hasCredentials) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    authInstance = getAuth(app);
    isFirebaseActive = true;
    
    // Validate connection to Firestore as requested by prompt guidelines
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(dbInstance, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
  }
}

export const db = dbInstance;
export const auth = authInstance;
export const firebaseEnabled = isFirebaseActive;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authInstance?.currentUser?.uid || null,
      email: authInstance?.currentUser?.email || null,
      emailVerified: authInstance?.currentUser?.emailVerified || null,
      isAnonymous: authInstance?.currentUser?.isAnonymous || null,
      tenantId: authInstance?.currentUser?.tenantId || null,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
