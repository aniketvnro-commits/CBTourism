import { requireAdminAuth } from "../utils/authGuard.js";
import { db } from "../config/firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  await requireAdminAuth();
  await loadAdminDashboard();
});

async function loadAdminDashboard() {
  try {
    // Fetch all data in parallel
    const [vendors, packages, inquiries, bookings] = await Promise.all([
      fetchAll("vendors"),
      fetchAll("packages"),
      fetchAll("inquiries"),
      fetchAll("booking_requests")
    ]);

    renderStats(vendors, packages, inquiries, bookings);
    renderRecentVendors(vendors);
    renderRecentBookings(bookings);
  } catch (error) {
    console.error("Admin dashboard error:", error);
  }
}

// ─── Fetch entire collection ──────────────────────────────────────────────────
async function fetchAll(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  const results = [];
  snapshot.forEach((docItem) => results.push({ id: docItem.id, ...docItem.data() }));
  return results;
}

// ─── Stat cards ───────────────────────────────────────────────────────────────
function renderStats(vendors, packages, inquiries, bookings) {
  const newRequests = bookings.filter(
    (b) => (b.status || "new").toLowerCase() === "new"
  );

  setText("statVendors", vendors.length);
  setText("statPackages", packages.length);
  setText("statInquiries", inquiries.length);
  setText("statNewRequests", newRequests.length);
}

// ─── Recent vendors list ──────────────────────────────────────────────────────
function renderRecentVendors(vendors) {
  const container = document.getElementById("recentVendorsList");
  if (!container) return;

  const recent = [...vendors]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  if (!recent.length) {
    container.innerHTML = `<div class="admin-empty">No vendors registered yet.</div>`;
    return;
  }

  container.innerHTML = recent.map((vendor) => {
    const initials = getInitials(vendor.businessName || vendor.ownerName || "V");
    return `
      <div class="admin-list-item">
        <div class="admin-list-avatar">${escapeHtml(initials)}</div>
        <div class="admin-list-body">
          <h4>${escapeHtml(vendor.businessName || "Unnamed Business")}</h4>
          <p>${escapeHtml(vendor.ownerName || "")} • ${escapeHtml(vendor.location || "Location not set")}</p>
        </div>
        <span class="admin-list-badge">Vendor</span>
      </div>
    `;
  }).join("");
}

// ─── Recent bookings list ─────────────────────────────────────────────────────
function renderRecentBookings(bookings) {
  const container = document.getElementById("recentBookingsList");
  if (!container) return;

  const recent = [...bookings]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  if (!recent.length) {
    container.innerHTML = `<div class="admin-empty">No bookings submitted yet.</div>`;
    return;
  }

  container.innerHTML = recent.map((booking) => {
    const status = (booking.status || "new").toLowerCase();
    const date = booking.travelDate
      ? new Date(booking.travelDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      : "Date not provided";

    return `
      <div class="admin-list-item">
        <img
          src="${escapeHtml(booking.image || "assets/images/kerala-bg.jpg")}"
          alt="${escapeHtml(booking.packageName || "Package")}"
          class="admin-list-thumb"
        />
        <div class="admin-list-body">
          <h4>${escapeHtml(booking.packageName || "Booking Request")}</h4>
          <p>${escapeHtml(booking.fullName || "Traveler")} • ${escapeHtml(date)}</p>
        </div>
        <span class="admin-list-badge ${escapeHtml(status)}">${escapeHtml(status)}</span>
      </div>
    `;
  }).join("");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getInitials(name) {
  return String(name)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}