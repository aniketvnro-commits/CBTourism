import { requireAdminAuth } from "../utils/authGuard.js";
import { db } from "../config/firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let allVendors = [];

document.addEventListener("DOMContentLoaded", async () => {
  await requireAdminAuth();
  attachSearch();
  await loadVendors();
});

async function loadVendors() {
  const grid = document.getElementById("vendorsGrid");
  const summary = document.getElementById("vendorSummary");

  if (!grid || !summary) return;

  try {
    grid.innerHTML = `<div class="admin-empty-state"><p>Loading vendors...</p></div>`;
    summary.textContent = "Loading vendors...";

    const [vendors, packages, bookings] = await Promise.all([
      fetchAll("vendors"),
      fetchAll("packages"),
      fetchAll("booking_requests")
    ]);

    const packageCountMap = {};
    for (const pkg of packages) {
      const vendorId = pkg.vendorId;
      if (!vendorId) continue;
      packageCountMap[vendorId] = (packageCountMap[vendorId] || 0) + 1;
    }

    const bookingCountMap = {};
    for (const booking of bookings) {
      const vendorId = booking.vendorId;
      if (!vendorId) continue;
      bookingCountMap[vendorId] = (bookingCountMap[vendorId] || 0) + 1;
    }

    allVendors = vendors
      .map((vendor) => ({
        ...vendor,
        packageCount: packageCountMap[vendor.uid] || 0,
        bookingCount: bookingCountMap[vendor.uid] || 0,
        createdAtMs: toMillis(vendor.createdAt)
      }))
      .sort((a, b) => b.createdAtMs - a.createdAtMs);

    renderVendors(allVendors);
  } catch (error) {
    console.error("Failed to load admin vendors:", error);
    grid.innerHTML = `
      <div class="admin-empty-state">
        <p>Failed to load vendors. ${escapeHtml(error.message || "Unknown error")}</p>
      </div>
    `;
    summary.textContent = "Unable to load vendors";
  }
}

function renderVendors(vendors) {
  const grid = document.getElementById("vendorsGrid");
  const summary = document.getElementById("vendorSummary");

  if (!grid || !summary) return;

  summary.textContent = `Showing ${vendors.length} vendor${vendors.length === 1 ? "" : "s"}`;

  if (!vendors.length) {
    grid.innerHTML = `
      <div class="admin-empty-state">
        <p>No vendors found.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = vendors
    .map((vendor) => {
      const businessName = vendor.businessName || "Unnamed Business";
      const ownerName = vendor.ownerName || "Owner not set";
      const email = vendor.email || "Not provided";
      const phone = vendor.phone || "Not provided";
      const location = vendor.location || "Not provided";
      const description = vendor.description || "";
      const joinedDate = vendor.createdAtMs
        ? new Date(vendor.createdAtMs).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })
        : "Unknown";

      return `
        <div class="admin-vendor-card">
          <div class="admin-vendor-card-head">
            <div class="admin-vendor-avatar">${escapeHtml(getInitials(businessName))}</div>
            <div class="admin-vendor-name">
              <h3>${escapeHtml(businessName)}</h3>
              <p>${escapeHtml(ownerName)}</p>
            </div>
          </div>

          <div class="admin-vendor-stats">
            <div class="admin-vendor-stat">
              <span class="admin-vendor-stat-value">${vendor.packageCount}</span>
              <span class="admin-vendor-stat-label">Packages</span>
            </div>
            <div class="admin-vendor-stat">
              <span class="admin-vendor-stat-value">${vendor.bookingCount}</span>
              <span class="admin-vendor-stat-label">Bookings</span>
            </div>
            <div class="admin-vendor-stat">
              <span class="admin-vendor-stat-value">${getBookingRate(vendor.packageCount, vendor.bookingCount)}</span>
              <span class="admin-vendor-stat-label">Rate</span>
            </div>
          </div>

          <div class="admin-vendor-details">
            <div class="admin-vendor-detail-row">
              <strong>Email</strong>
              <span>${escapeHtml(email)}</span>
            </div>
            <div class="admin-vendor-detail-row">
              <strong>Phone</strong>
              <span>${escapeHtml(phone)}</span>
            </div>
            <div class="admin-vendor-detail-row">
              <strong>Location</strong>
              <span>${escapeHtml(location)}</span>
            </div>
            <div class="admin-vendor-detail-row">
              <strong>Joined</strong>
              <span>${escapeHtml(joinedDate)}</span>
            </div>
            ${
              description
                ? `
              <div class="admin-vendor-detail-row">
                <strong>About</strong>
                <span>${escapeHtml(description)}</span>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function attachSearch() {
  const input = document.getElementById("vendorSearch");
  if (!input) return;

  input.addEventListener("input", () => {
    const keyword = input.value.trim().toLowerCase();

    if (!keyword) {
      renderVendors(allVendors);
      return;
    }

    const filtered = allVendors.filter((vendor) => {
      return (
        (vendor.businessName || "").toLowerCase().includes(keyword) ||
        (vendor.ownerName || "").toLowerCase().includes(keyword) ||
        (vendor.email || "").toLowerCase().includes(keyword) ||
        (vendor.phone || "").toLowerCase().includes(keyword) ||
        (vendor.location || "").toLowerCase().includes(keyword) ||
        (vendor.description || "").toLowerCase().includes(keyword)
      );
    });

    renderVendors(filtered);
  });
}

async function fetchAll(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

function toMillis(value) {
  if (!value) return 0;

  if (typeof value === "number") return value;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (value?.seconds) {
    return value.seconds * 1000;
  }

  return 0;
}

function getBookingRate(packageCount, bookingCount) {
  if (!packageCount) return "—";
  return `${bookingCount}/${packageCount}`;
}

function getInitials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
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