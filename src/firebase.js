// firebase.js - Firebase 초기화 최종본
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let app;
let auth;
let db;
let appCheck;

export const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase app initialized");
  }

  if (!auth) {
    auth = getAuth(app);
    console.log("✅ Firebase Auth initialized");
  }

  if (!db) {
    db = getFirestore(app);
    console.log("✅ Firestore initialized");
  }

  if (!appCheck) {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("✅ Firebase AppCheck initialized");
    } catch (error) {
      console.warn("⚠️ AppCheck 초기화 실패:", error.message);
    }
  }

  return { app, auth, db };
};
