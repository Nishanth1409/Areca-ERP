"use client";

import { initializeApp, getApps } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

function getFirebaseApp() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const hasMissingConfig = Object.values(config).some((value) => !value);
  if (hasMissingConfig) {
    throw new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* env values.");
  }

  return getApps().length ? getApps()[0] : initializeApp(config);
}

export async function uploadBackupJson(payload: unknown) {
  const app = getFirebaseApp();
  const storage = getStorage(app);
  const json = JSON.stringify(payload, null, 2);
  const fileName = `backups/areca-backup-${Date.now()}.json`;
  const fileRef = ref(storage, fileName);
  await uploadBytes(fileRef, new Blob([json], { type: "application/json" }));
  return getDownloadURL(fileRef);
}
