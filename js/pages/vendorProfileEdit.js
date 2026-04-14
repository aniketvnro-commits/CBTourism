import { requireVendorAuth } from "../utils/authGuard.js";
import { db } from "../config/firebase-config.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  await loadVendorProfileForEdit();
});

async function loadVendorProfileForEdit() {
  const form = document.getElementById("vendorProfileEditForm");
  const messageEl = document.getElementById("vendorProfileEditMessage");
  const saveBtn = document.getElementById("saveVendorProfileBtn");

  if (!form || !messageEl || !saveBtn) {
    console.error("Vendor profile edit page: required DOM elements not found.");
    return;
  }

  try {
    messageEl.textContent = "Loading profile details...";

    const user = await requireVendorAuth();
    const vendorRef = doc(db, "vendors", user.uid);
    const vendorSnap = await getDoc(vendorRef);

    if (vendorSnap.exists()) {
      const vendorData = vendorSnap.data();

      document.getElementById("businessName").value = vendorData.businessName || "";
      document.getElementById("ownerName").value = vendorData.ownerName || "";
      document.getElementById("phone").value = vendorData.phone || "";
      document.getElementById("location").value = vendorData.location || "";
      document.getElementById("description").value = vendorData.description || "";
    }

    messageEl.textContent = "";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const businessName = document.getElementById("businessName")?.value.trim();
      const ownerName = document.getElementById("ownerName")?.value.trim();
      const phone = document.getElementById("phone")?.value.trim();
      const location = document.getElementById("location")?.value.trim();
      const description = document.getElementById("description")?.value.trim();

      if (!businessName || !ownerName || !phone || !location) {
        messageEl.textContent = "Please fill all required profile fields.";
        return;
      }

      try {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
        messageEl.textContent = "Saving profile...";

        const currentUser = await requireVendorAuth();
        const currentVendorRef = doc(db, "vendors", currentUser.uid);
        const currentVendorSnap = await getDoc(currentVendorRef);

        const profilePayload = {
          uid: currentUser.uid,
          businessName,
          ownerName,
          phone,
          location,
          description: description || "",
          updatedAt: Date.now()
        };

        if (currentVendorSnap.exists()) {
          await updateDoc(currentVendorRef, profilePayload);
        } else {
          await setDoc(currentVendorRef, {
            ...profilePayload,
            createdAt: Date.now()
          });
        }

        messageEl.textContent = "Profile updated successfully.";

        setTimeout(() => {
          window.location.href = "vendor-profile.html";
        }, 800);
      } catch (error) {
        console.error("Vendor profile update error:", error);
        messageEl.textContent = error.message || "Failed to update vendor profile.";
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Profile";
      }
    });
  } catch (error) {
    console.error("Vendor profile edit load error:", error);
    messageEl.textContent = error.message || "Failed to load vendor profile.";
  }
}