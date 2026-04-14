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

    const title = escapeHtml(pkg.title || "Untitled Experience");
    const image = escapeHtml(pkg.image || "assets/images/kerala-bg.jpg");
    const location = escapeHtml(pkg.location || "Location not specified");
    const duration = escapeHtml(pkg.duration || "Duration not specified");
    const price = escapeHtml(String(pkg.price || "N/A"));
    const description = pkg.description || "No detailed description is available for this experience yet.";
    const bookingUrl = `booking.html?id=${encodeURIComponent(pkg.id)}`;

    container.innerHTML = `
      <img
        src="${image}"
        alt="${title}"
        class="hero-image"
      />

      <h1 class="title">${title}</h1>
      <p class="meta">${location} • ${duration}</p>

      <div class="layout">
        <div>
          <div class="section">
            <h2>About this experience</h2>
            ${formatParagraphs(description)}
          </div>
        </div>

        <aside class="booking-card">
          <div class="price">₹${price}</div>
          <div class="info-line">📍 ${location}</div>
          <div class="info-line">⏳ ${duration}</div>

          <a href="${bookingUrl}" class="book-btn-link">
            <button type="button" class="book-btn">Book This Experience</button>
          </a>

          <a href="packages.html" class="back-btn" style="margin-top:14px; display:inline-block;">
            More Packages
          </a>

          <button
            type="button"
            class="back-btn"
            id="packageBackBtn"
            style="margin-top:12px; background:none; border:none; padding:0; cursor:pointer;"
          >
            ← Back
          </button>
        </aside>
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
