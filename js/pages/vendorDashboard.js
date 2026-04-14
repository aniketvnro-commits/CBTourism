import { subscribeToVendorPackages } from "../services/packageService.js";
import { getVendorBookingRequests } from "../services/bookingService.js";
import { requireVendorAuth } from "../utils/authGuard.js";

document.addEventListener("DOMContentLoaded", async () => {
  await requireVendorAuth();
  await loadVendorDashboard();
});

async function loadVendorDashboard() {
  const totalPackagesValue = document.getElementById("totalPackagesValue");
  const activePackagesValue = document.getElementById("activePackagesValue");
  const totalRequestsValue = document.getElementById("totalRequestsValue");
  const newRequestsValue = document.getElementById("newRequestsValue");

  const recentRequestsList = document.getElementById("recentRequestsList");
  const recentPackagesList = document.getElementById("recentPackagesList");

  try {
    subscribeToVendorPackages(
      (packages) => {
        const activePackages = packages.filter((pkg) => (pkg.status || "").toLowerCase() === "active");

        if (totalPackagesValue) totalPackagesValue.textContent = packages.length;
        if (activePackagesValue) activePackagesValue.textContent = activePackages.length;

        renderRecentPackages(packages, recentPackagesList);
      },
      (error) => {
        console.error("Vendor package subscription error:", error);

        if (recentPackagesList) {
          recentPackagesList.innerHTML = `
            <div class="vendor-empty-state">
              Failed to load package data. ${escapeHtml(error.message || "")}
            </div>
          `;
        }
      }
    );

    const requests = await getVendorBookingRequests();
    const newRequests = requests.filter((req) => (req.status || "").toLowerCase() === "new");

    if (totalRequestsValue) totalRequestsValue.textContent = requests.length;
    if (newRequestsValue) newRequestsValue.textContent = newRequests.length;

    renderRecentRequests(requests, recentRequestsList);
  } catch (error) {
    console.error("Vendor dashboard error:", error);

    if (recentPackagesList) {
      recentPackagesList.innerHTML = `
        <div class="vendor-empty-state">
          Failed to load package data. ${escapeHtml(error.message || "")}
        </div>
      `;
    }

    if (recentRequestsList) {
      recentRequestsList.innerHTML = `
        <div class="vendor-empty-state">
          Failed to load booking request data. ${escapeHtml(error.message || "")}
        </div>
      `;
    }
  }
}

function renderRecentPackages(packages, container) {
  if (!container) return;

  container.innerHTML = "";

  if (!packages.length) {
    container.innerHTML = `
      <div class="vendor-empty-state">
        No packages added yet. Add your first package to start receiving travel interest.
      </div>
    `;
    return;
  }

  packages.slice(0, 4).forEach((pkg) => {
    const item = document.createElement("div");
    item.className = "vendor-list-item";

    item.innerHTML = `
      <img
        src="${pkg.image || "assets/images/kerala-bg.jpg"}"
        alt="${escapeHtml(pkg.title || "Package")}"
        class="vendor-list-thumb"
      />

      <div class="vendor-list-body">
        <h4>${escapeHtml(pkg.title || "Untitled Package")}</h4>
        <p class="vendor-list-meta">
          ${escapeHtml(pkg.location || "Location not specified")} •
          ${escapeHtml(pkg.duration || "Duration not specified")} •
          ₹${escapeHtml(String(pkg.price || "N/A"))}
        </p>
        <span class="vendor-status-badge">${escapeHtml(pkg.status || "active")}</span>
      </div>
    `;

    container.appendChild(item);
  });
}

function renderRecentRequests(requests, container) {
  if (!container) return;

  container.innerHTML = "";

  if (!requests.length) {
    container.innerHTML = `
      <div class="vendor-empty-state">
        No booking requests yet. Once a traveler submits a booking request, it will appear here.
      </div>
    `;
    return;
  }

  requests.slice(0, 4).forEach((request) => {
    const item = document.createElement("div");
    item.className = "vendor-list-item";

    item.innerHTML = `
      <img
        src="${request.image || "assets/images/kerala-bg.jpg"}"
        alt="${escapeHtml(request.packageName || "Package")}"
        class="vendor-list-thumb"
      />

      <div class="vendor-list-body">
        <h4>${escapeHtml(request.packageName || "Booking Request")}</h4>
        <p class="vendor-list-meta">
          ${escapeHtml(request.fullName || "Traveler")} •
          ${escapeHtml(request.travelDate || "Date not provided")} •
          ${escapeHtml(String(request.guests || "0"))} guest(s)
        </p>
        <span class="vendor-status-badge">${escapeHtml(request.status || "new")}</span>
      </div>
    `;

    container.appendChild(item);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}