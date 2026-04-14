import { requireVendorAuth } from "../utils/authGuard.js";
import { subscribeToVendorPackages, deletePackage } from "../services/packageService.js";

document.addEventListener("DOMContentLoaded", async () => {
  const packageList = document.getElementById("vendorPackageList");
  const packageMessage = document.getElementById("packageMessage");

  if (!packageList || !packageMessage) {
    console.error("Vendor packages page: required DOM elements not found.");
    return;
  }

  try {
    packageMessage.textContent = "Loading your packages...";

    await requireVendorAuth();

    subscribeToVendorPackages(
      (packages) => {
        if (!packages.length) {
          packageMessage.textContent = "";
          packageList.innerHTML = `
            <div class="empty-state">
              <p>No packages added yet.</p>
              <p>Add your first tourism package to start receiving bookings.</p>
            </div>
          `;
          return;
        }

        packageMessage.textContent = "";
        renderPackages(packages, packageList);
      },
      (error) => {
        console.error("Vendor packages subscription error:", error);
        packageMessage.textContent = error.message || "Failed to load packages.";
        packageList.innerHTML = `
          <div class="empty-state">
            <p>Unable to load packages right now.</p>
          </div>
        `;
      }
    );
  } catch (error) {
    console.error("Vendor packages load error:", error);
    packageMessage.textContent = error.message || "Failed to load packages.";
    packageList.innerHTML = `
      <div class="empty-state">
        <p>Unable to load packages right now.</p>
      </div>
    `;
  }
});

function renderPackages(packages, container) {
  container.innerHTML = packages.map((pkg) => {
    const image = pkg.image || "assets/images/kerala-bg.jpg";
    const title = escapeHtml(pkg.title || "Untitled Package");
    const location = escapeHtml(pkg.location || "Location not set");
    const duration = escapeHtml(pkg.duration || "Duration not set");
    const price = escapeHtml(pkg.price || "0");
    const description = escapeHtml(truncateText(pkg.description || "No description provided.", 120));
    const packageId = encodeURIComponent(pkg.id);

    return `
      <div class="vendor-package-card">
        <img src="${escapeHtml(image)}" alt="${title}" />

        <div class="vendor-package-body">
          <h3>${title}</h3>

          <p class="vendor-package-meta">
            ${location} • ${duration} • ₹${price}
          </p>

          <p>${description}</p>

          <div class="vendor-package-actions">
            <a href="package-details.html?id=${packageId}" class="btn btn-outline">View</a>
            <a href="edit-package.html?id=${packageId}" class="btn btn-outline">Edit</a>
            <button class="btn btn-primary delete-package-btn" data-id="${escapeHtml(pkg.id)}">
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  attachDeleteHandlers();
}

function attachDeleteHandlers() {
  const deleteButtons = document.querySelectorAll(".delete-package-btn");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const packageId = button.dataset.id;

      if (!packageId) return;

      const confirmed = window.confirm("Are you sure you want to delete this package?");
      if (!confirmed) return;

      const originalText = button.textContent;

      try {
        button.disabled = true;
        button.textContent = "Deleting...";

        await deletePackage(packageId);
      } catch (error) {
        console.error("Delete package error:", error);
        alert(error.message || "Failed to delete package.");
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  });
}

function truncateText(text, maxLength) {
  const safeText = String(text);
  if (safeText.length <= maxLength) return safeText;
  return safeText.slice(0, maxLength).trim() + "...";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}