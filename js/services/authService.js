import { app, db } from "../config/firebase-config.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);

async function registerVendor({
  name,
  email,
  password,
  businessName,
  phone,
  location,
  description
}) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name,
    email,
    role: "vendor",
    createdAt: Date.now()
  });

  await setDoc(doc(db, "vendors", user.uid), {
    uid: user.uid,
    businessName,
    ownerName: name,
    phone,
    location,
    description,
    createdAt: Date.now()
  });

  return user;
}

async function loginVendor(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

async function logoutVendor() {
  await signOut(auth);
}

function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

function getCurrentUser() {
  return auth.currentUser;
}

async function getCurrentUserProfile(uid) {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return userDoc.data();
}

export {
  auth,
  registerVendor,
  loginVendor,
  logoutVendor,
  watchAuthState,
  getCurrentUser,
  getCurrentUserProfile
};