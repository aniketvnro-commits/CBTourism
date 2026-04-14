import { logoutVendor } from "../services/authService.js";

/**
 * Attaches logout behaviour to any element with id="logoutBtn"
 * or class="logout-btn". Calls Firebase signOut then redirects to login.
 */
document.addEventListener("DOMContentLoaded", () => {
  const logoutButtons = document.querySelectorAll("#logoutBtn, .logout-btn");

  logoutButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await logoutVendor();
      } catch (err) {
        console.error("Logout error:", err);
      } finally {
        window.location.href = "login.html";
      }
    });
  });
});
