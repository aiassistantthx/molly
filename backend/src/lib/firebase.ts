import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const auth = admin.auth();

export const verifyToken = async (token: string) => {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
};
