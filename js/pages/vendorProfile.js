import { requireVendorAuth } from "../utils/authGuard.js";
import { db } from "../config/firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  await loadVendorProfile();
});

async function loadVendorProfile() {
  const messageEl = document.getElementById("vendorProfileMessage");
  const contentEl = document.getElementById("vendorProfileContent");

  if (!messageEl || !contentEl) {
    console.error("Vendor profile page: required DOM elements not found.");
    return;
  }

  try {
    messageEl.textContent = "Loading your profile...";

    const user = await requireVendorAuth();

    const [userSnap, vendorSnap] = await Promise.all([
      getDoc(doc(db, "users", user.uid)),
      getDoc(doc(db, "vendors", user.uid))
    ]);

    if (!userSnap.exists() && !vendorSnap.exists()) {
      messageEl.textContent = "";
      contentEl.innerHTML = `
        <div class="vendor-profile-empty">
          Your vendor profile could not be found.
        </div>
      `;
      return;
    }

    const userData = userSnap.exists() ? userSnap.data() : {};
    const vendorData = vendorSnap.exists() ? vendorSnap.data() : {};

    const businessName = vendorData.businessName || "Business name not added";
    const ownerName = vendorData.ownerName || userData.name || "Owner name not added";
    const email = userData.email || "Email not available";
    const phone = vendorData.phone || "Phone not added";
    const location = vendorData.location || "Location not added";
    const description = vendorData.description || "No business description added yet.";
    const role = userData.role || "vendor";
    const initials = getInitials(businessName || ownerName || "V");

    messageEl.textContent = "";

    contentEl.innerHTML = `
      <div class="vendor-profile-layout">
        <aside class="vendor-profile-card">
          <div class="vendor-profile-avatar">${escapeHtml(initials)}</div>
          <h3 class="vendor-profile-name">${escapeHtml(businessName)}</h3>
          <p class="vendor-profile-role">${escapeHtml(capitalize(role))}</p>

          <div class="vendor-profile-badges">
            <span class="vendor-profile-badge">Vendor Account</span>
            <span class="vendor-profile-badge">${escapeHtml(location)}</span>
          </div>

          <div class="vendor-profile-side-meta">
            <div class="meta-row">
              <span class="meta-label">Owner</span>
              <span class="meta-value">${escapeHtml(ownerName)}</span>
            </div>

            <div class="meta-row">
              <span class="meta-label">Email</span>
              <span class="meta-value">${escapeHtml(email)}</span>
            </div>

            <div class="meta-row">
              <span class="meta-label">Phone</span>
              <span class="meta-value">${escapeHtml(phone)}</span>
            </div>
          </div>
        </aside>

        <section class="vendor-profile-info-card">
          <div class="vendor-profile-section">
            <h3>Business Details</h3>

            <div class="vendor-profile-grid">
              <div class="vendor-profile-field">
                <span class="field-label">Business Name</span>
                <div class="field-value">${escapeHtml(businessName)}</div>
              </div>

              <div class="vendor-profile-field">
                <span class="field-label">Owner Name</span>
                <div class="field-value">${escapeHtml(ownerName)}</div>
              </div>

              <div class="vendor-profile-field">
                <span class="field-label">Email</span>
                <div class="field-value">${escapeHtml(email)}</div>
              </div>

              <div class="vendor-profile-field">
                <span class="field-label">Phone</span>
                <div class="field-value">${escapeHtml(phone)}</div>
              </div>

              <div class="vendor-profile-field full">
                <span class="field-label">Location</span>
                <div class="field-value">${escapeHtml(location)}</div>
              </div>
            </div>
          </div>

          <div class="vendor-profile-section">
            <h3>About Business</h3>

            <div class="vendor-profile-grid">
              <div class="vendor-profile-field full">
                <span class="field-label">Description</span>
                <div class="field-value">${escapeHtml(description)}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  } catch (error) {
    console.error("Vendor profile load error:", error);
    messageEl.textContent = error.message || "Failed to load profile.";
    contentEl.innerHTML = "";
  }
}

function getInitials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "V";
}

function capitalize(value) {
  const safe = String(value || "").trim().toLowerCase();
  if (!safe) return "";
  return safe.charAt(0).toUpperCase() + safe.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}