import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

if (getApps().length === 0 && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY !== 'YOUR_PRIVATE_KEY_HERE') {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '').trim(),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

// Next.js 빌드 중(가짜 환경 변수)에는 인스턴스 초기화를 건너뛰기 위한 모의 객체 반환
export const adminDb = getApps().length > 0 ? getFirestore() : ({} as any);
export const adminAuth = getApps().length > 0 ? getAuth() : ({} as any);
export const adminStorage = getApps().length > 0 ? getStorage() : ({} as any);
