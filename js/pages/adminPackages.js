import { requireAdminAuth } from "../utils/authGuard.js";
import { db } from "../config/firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let allPackages = [];
let vendorMap = {};

document.addEventListener("DOMContentLoaded", async () => {
  await requireAdminAuth();
  attachFilters();
  await loadAdminPackages();
});

async function loadAdminPackages() {
  const grid = document.getElementById("adminPackagesGrid");
  const summary = document.getElementById("packageSummary");

  if (!grid || !summary) return;

  try {
    grid.innerHTML = `<div class="admin-empty-state"><p>Loading packages...</p></div>`;
    summary.textContent = "Loading packages...";

    const [packageDocs, vendorDocs] = await Promise.all([
      fetchAll("packages"),
      fetchAll("vendors")
    ]);

    vendorMap = {};
    for (const vendor of vendorDocs) {
      vendorMap[vendor.uid] = vendor;
    }

    allPackages = packageDocs
      .map((pkg) => {
        const vendor = vendorMap[pkg.vendorId] || {};

        return {
          ...pkg,
          vendorBusinessName: vendor.businessName || "Unknown Vendor",
          vendorOwnerName: vendor.ownerName || "",
          vendorPhone: vendor.phone || "",
          createdAtMs: toMillis(pkg.createdAt),
          normalizedStatus: (pkg.status || "active").toLowerCase()
        };
      })
      .sort((a, b) => b.createdAtMs - a.createdAtMs);

    renderPackages(getFilteredPackages());
  } catch (error) {
    console.error("Failed to load admin packages:", error);
    grid.innerHTML = `
      <div class="admin-empty-state">
        <p>Failed to load packages. ${escapeHtml(error.message || "Unknown error")}</p>
      </div>
    `;
    summary.textContent = "Unable to load packages";
  }
}

function renderPackages(packages) {
  const grid = document.getElementById("adminPackagesGrid");
  const summary = document.getElementById("packageSummary");

  if (!grid || !summary) return;

  summary.textContent = `Showing ${packages.length} package${packages.length === 1 ? "" : "s"}`;

  if (!packages.length) {
    grid.innerHTML = `
      <div class="admin-empty-state">
        <p>No packages found for the selected filter.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = packages
    .map((pkg) => {
      const safeStatus = pkg.normalizedStatus === "inactive" ? "inactive" : "active";
      const createdDate = pkg.createdAtMs
        ? new Date(pkg.createdAtMs).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })
        : "Unknown";

      return `
        <div class="admin-package-card">
          <div class="admin-package-image-wrap">
            <img
              src="${escapeAttribute(pkg.image || "https://via.placeholder.com/900x600?text=Package+Image")}"
              alt="${escapeAttribute(pkg.title || "Package")}"
              class="admin-package-image"
            />
            <span class="admin-package-status ${safeStatus}">
              ${escapeHtml(safeStatus)}
            </span>
          </div>

          <div class="admin-package-body">
            <div class="admin-package-title-row">
              <h3>${escapeHtml(pkg.title || "Untitled Package")}</h3>
              <div class="admin-package-price">₹${escapeHtml(pkg.price ?? "—")}</div>
            </div>

            <div class="admin-package-meta">
              <span>${escapeHtml(pkg.location || "Location not set")}</span>
              <span>${escapeHtml(pkg.duration || "Duration not set")}</span>
            </div>

            <p class="admin-package-description">
              ${escapeHtml(truncateText(pkg.description || "No description added yet.", 140))}
            </p>

            <div class="admin-package-info">
              <div class="admin-package-info-row">
                <strong>Vendor</strong>
                <span>${escapeHtml(pkg.vendorBusinessName)}</span>
              </div>
              <div class="admin-package-info-row">
                <strong>Vendor ID</strong>
                <span>${escapeHtml(pkg.vendorId || "—")}</span>
              </div>
              <div class="admin-package-info-row">
                <strong>Created</strong>
                <span>${escapeHtml(createdDate)}</span>
              </div>
            </div>

            <div class="admin-package-actions">
              <a
                href="package-details.html?id=${encodeURIComponent(pkg.id)}"
                class="admin-action-btn view"
                style="text-decoration:none; display:inline-flex; align-items:center;"
              >
                View
              </a>

              <button
                class="admin-action-btn toggle toggle-package-btn"
                data-id="${escapeAttribute(pkg.id)}"
                data-status="${escapeAttribute(safeStatus)}"
              >
                ${safeStatus === "active" ? "Deactivate" : "Activate"}
              </button>

              <button
                class="admin-action-btn delete delete-package-btn"
                data-id="${escapeAttribute(pkg.id)}"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  attachActionHandlers();
}

function attachFilters() {
  const searchInput = document.getElementById("packageSearch");
  const statusFilter = document.getElementById("statusFilter");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderPackages(getFilteredPackages());
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      renderPackages(getFilteredPackages());
    });
  }
}

function getFilteredPackages() {
  const searchValue = (document.getElementById("packageSearch")?.value || "")
    .trim()
    .toLowerCase();

  const statusValue = document.getElementById("statusFilter")?.value || "all";

  return allPackages.filter((pkg) => {
    const matchesSearch =
      !searchValue ||
      (pkg.title || "").toLowerCase().includes(searchValue) ||
      (pkg.location || "").toLowerCase().includes(searchValue) ||
      (pkg.description || "").toLowerCase().includes(searchValue) ||
      (pkg.vendorBusinessName || "").toLowerCase().includes(searchValue) ||
      (pkg.vendorOwnerName || "").toLowerCase().includes(searchValue) ||
      (pkg.vendorPhone || "").toLowerCase().includes(searchValue);

    const matchesStatus =
      statusValue === "all" || pkg.normalizedStatus === statusValue;

    return matchesSearch && matchesStatus;
  });
}

function attachActionHandlers() {
  const toggleButtons = document.querySelectorAll(".toggle-package-btn");
  const deleteButtons = document.querySelectorAll(".delete-package-btn");

  toggleButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const packageId = button.dataset.id;
      const currentStatus = button.dataset.status || "active";
      const nextStatus = currentStatus === "active" ? "inactive" : "active";

      const confirmed = window.confirm(
        `Are you sure you want to ${nextStatus === "inactive" ? "deactivate" : "activate"} this package?`
      );
      if (!confirmed) return;

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Saving...";

      try {
        await updateDoc(doc(db, "packages", packageId), {
          status: nextStatus
        });

        const target = allPackages.find((pkg) => pkg.id === packageId);
        if (target) {
          target.status = nextStatus;
          target.normalizedStatus = nextStatus;
        }

        renderPackages(getFilteredPackages());
      } catch (error) {
        console.error("Package status update failed:", error);
        alert(error.message || "Failed to update package status.");
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const packageId = button.dataset.id;

      const packageSnap = await getDoc(doc(db, "packages", packageId));
      const packageTitle = packageSnap.exists()
        ? packageSnap.data().title || "this package"
        : "this package";

      const confirmed = window.confirm(
        `Are you sure you want to permanently delete "${packageTitle}"? This cannot be undone.`
      );
      if (!confirmed) return;

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Deleting...";

      try {
        await deleteDoc(doc(db, "packages", packageId));

        allPackages = allPackages.filter((pkg) => pkg.id !== packageId);
        renderPackages(getFilteredPackages());
      } catch (error) {
        console.error("Package delete failed:", error);
        alert(error.message || "Failed to delete package.");
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  });
}

async function fetchAll(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }));
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (value?.seconds) return value.seconds * 1000;
  return 0;
}

function truncateText(text, maxLength = 140) {
  const clean = String(text || "").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}...`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}