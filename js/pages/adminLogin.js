import { auth } from "../services/authService.js";
import { db } from "../config/firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminLoginForm");
  const emailInput = document.getElementById("adminEmail");
  const passwordInput = document.getElementById("adminPassword");
  const loginBtn = document.getElementById("adminLoginBtn");
  const messageEl = document.getElementById("adminLoginMessage");

  if (!form || !emailInput || !passwordInput || !loginBtn || !messageEl) {
    console.error("Admin login page elements not found.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    clearMessage(messageEl);

    if (!email || !password) {
      showMessage(messageEl, "Please enter both email and password.", "error");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Checking...";

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await signOut(auth);
        showMessage(messageEl, "No admin profile found for this account.", "error");
        return;
      }

      const userData = userDocSnap.data();
      const role = String(userData.role || "").toLowerCase();

      if (role !== "admin") {
        await signOut(auth);
        showMessage(messageEl, "Access denied. This account is not an admin.", "error");
        return;
      }

      showMessage(messageEl, "Login successful. Redirecting to admin dashboard...", "success");

      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 700);
    } catch (error) {
      console.error("Admin login failed:", error);
      showMessage(messageEl, getFirebaseErrorMessage(error.code), "error");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login as Admin";
    }
  });
});

function showMessage(element, text, type = "") {
  element.textContent = text;
  element.className = "";
  if (type) element.classList.add(type);
}

function clearMessage(element) {
  element.textContent = "";
  element.className = "";
}

function getFirebaseErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Invalid email format.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";
    default:
      return "Admin login failed. Please try again.";
  }
}
