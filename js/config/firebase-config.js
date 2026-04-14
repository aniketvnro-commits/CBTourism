import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA5wFO3DoTxqeQzkdHR-dfUtVC2iPLpGGY",
  authDomain: "cbt-platform-4d18e.firebaseapp.com",
  projectId: "cbt-platform-4d18e",
  storageBucket: "cbt-platform-4d18e.firebasestorage.app",
  messagingSenderId: "167562306302",
  appId: "1:167562306302:web:6650662afa2139bd45fbaf",
  measurementId: "G-16YBT97SVL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

