import { watchAuthState, getCurrentUserProfile } from "../services/authService.js";

export function requireVendorAuth() {
  return new Promise((resolve) => {
    watchAuthState(async (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      try {
        const profile = await getCurrentUserProfile(user.uid);

        if (!profile || String(profile.role).toLowerCase() !== "vendor") {
          window.location.href = "login.html";
          return;
        }

        resolve(user);
      } catch (error) {
        console.error("Vendor auth guard error:", error);
        window.location.href = "login.html";
      }
    });
  });
}

export function requireAdminAuth() {
  return new Promise((resolve) => {
    watchAuthState(async (user) => {
      if (!user) {
        window.location.href = "admin-login.html";
        return;
      }

      try {
        const profile = await getCurrentUserProfile(user.uid);

        if (!profile || String(profile.role).toLowerCase() !== "admin") {
          window.location.href = "admin-login.html";
          return;
        }

        resolve(user);
      } catch (error) {
        console.error("Admin auth guard error:", error);
        window.location.href = "admin-login.html";
      }
    });
  });
}