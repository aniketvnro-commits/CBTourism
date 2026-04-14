import { getPackageById } from "../services/packageService.js";

document.addEventListener("DOMContentLoaded", () => {
  loadPackageDetails();
});

async function loadPackageDetails() {
  const container = document.getElementById("packageDetailsContainer");

  if (!container) {
    console.error("Package details page: #packageDetailsContainer not found.");
    return;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      container.innerHTML = `
        <div class="details-error">Invalid package.</div>
      `;
      return;
    }

    const pkg = await getPackageById(id);

    if ((pkg.status || "").toLowerCase() !== "active") {
      container.innerHTML = `
        <div class="details-error">
          This package is currently unavailable.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="package-detail-layout">
        <div class="package-intro">
          <div>
            <div class="package-mini-label">Community Based Tourism</div>
            <h1 class="package-main-title">${escapeHtml(pkg.title || "Untitled Package")}</h1>
          </div>

          <div>
            <p class="package-intro-text">
              ${escapeHtml(
                pkg.description ||
                "Explore an authentic, curated travel experience with trusted local partners."
              )}
            </p>

            <div class="package-intro-actions">
              <a href="booking.html?id=${encodeURIComponent(pkg.id)}" class="btn btn-primary">
                Book Now
              </a>
              <a href="packages.html" class="btn btn-outline">
                More Packages
              </a>
              <button type="button" class="package-back-link" id="packageBackBtn">
                ← Back
              </button>
            </div>
          </div>
        </div>

        <div class="package-hero-image-section">
          <img
            class="package-hero-image"
            src="${escapeHtml(pkg.image || "assets/images/kerala-bg.jpg")}"
            alt="${escapeHtml(pkg.title || "Package")}"
          />
        </div>

        <div class="package-info-grid">
          <div class="package-info-card">
            <span class="package-info-label">Location</span>
            <span class="package-info-value">${escapeHtml(pkg.location || "Not specified")}</span>
          </div>

          <div class="package-info-card">
            <span class="package-info-label">Duration</span>
            <span class="package-info-value">${escapeHtml(pkg.duration || "Not specified")}</span>
          </div>

          <div class="package-info-card">
            <span class="package-info-label">Price</span>
            <span class="package-info-value">₹${escapeHtml(String(pkg.price || "N/A"))}</span>
          </div>

          <div class="package-info-card">
            <span class="package-info-label">Status</span>
            <span class="package-info-value" style="text-transform: capitalize;">
              ${escapeHtml(pkg.status || "active")}
            </span>
          </div>
        </div>

        <div class="package-story-section">
          <div class="package-story-header">
            <h2>About this experience</h2>
            <p>
              This package connects travelers with authentic, community-based tourism experiences.
              Review the package details below before continuing to the booking request step.
            </p>
          </div>

          <div class="package-story-content">
            ${formatParagraphs(
              pkg.description || "No detailed description is available for this package yet."
            )}
          </div>
        </div>
      </div>
    `;

    attachBackButton();
  } catch (error) {
    console.error("Package details error:", error);
    container.innerHTML = `
      <div class="details-error">
        Error: ${escapeHtml(error.message || "Failed to load package.")}
      </div>
    `;
  }
}

function attachBackButton() {
  const backBtn = document.getElementById("packageBackBtn");
  if (!backBtn) return;

  backBtn.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "packages.html";
    }
  });
}

function formatParagraphs(text) {
  return String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
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