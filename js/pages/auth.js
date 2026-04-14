import { registerVendor, loginVendor } from "../services/authService.js";

console.log("auth.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");

  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const messageBox = document.getElementById("formMessage");

  if (registerForm) {
    console.log("registerForm found");

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("register submit triggered");

      const name = document.getElementById("name")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value.trim();
      const businessName = document.getElementById("businessName")?.value.trim();
      const phone = document.getElementById("phone")?.value.trim();
      const location = document.getElementById("location")?.value.trim();
      const description = document.getElementById("description")?.value.trim();

      try {
        if (messageBox) messageBox.textContent = "Creating account...";

        await registerVendor({
          name,
          email,
          password,
          businessName,
          phone,
          location,
          description
        });

        if (messageBox) messageBox.textContent = "Registration successful. Redirecting to login...";

        registerForm.reset();

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1200);
      } catch (error) {
        console.error("Registration error:", error);
        if (messageBox) messageBox.textContent = error.message;
        else alert(error.message);
      }
    });
  }

  if (loginForm) {
    console.log("loginForm found");

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("login submit triggered");

      const email = document.getElementById("loginEmail")?.value.trim();
      const password = document.getElementById("loginPassword")?.value.trim();

      try {
        if (messageBox) messageBox.textContent = "Logging in...";

        await loginVendor(email, password);

        if (messageBox) messageBox.textContent = "Login successful. Redirecting...";

        setTimeout(() => {
          window.location.href = "vendor-dashboard.html";
        }, 1000);
      } catch (error) {
        console.error("Login error:", error);
        if (messageBox) messageBox.textContent = error.message;
        else alert(error.message);
      }
    });
  }
});