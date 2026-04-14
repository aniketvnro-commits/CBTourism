import { subscribeToActivePackages } from "../services/packageService.js";
import { createPackageCard } from "../modules/packageCard.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("packagesGrid");
  const searchInput = document.getElementById("searchKeyword");
  const locationFilter = document.getElementById("locationFilter");
  const sortSelect = document.getElementById("sortPackages");

  if (!container) return;

  let allPackages = [];
  const initialLocationFromUrl = getLocationFromUrl();

  container.innerHTML = "<p>Loading packages...</p>";

  subscribeToActivePackages(
    (packages) => {
      allPackages = packages;
      populateLocationFilter(allPackages, locationFilter);

      if (locationFilter && initialLocationFromUrl) {
        const matchedOption = [...locationFilter.options].find(
          (option) => option.value.toLowerCase() === initialLocationFromUrl.toLowerCase()
        );

        if (matchedOption) {
          locationFilter.value = matchedOption.value;
        }
      }

      renderActiveFilterBar(locationFilter?.value || "");
      applyFiltersAndRender();
    },
    (error) => {
      console.error("Packages page error:", error);
      container.innerHTML = `<p>Error: ${error.message}</p>`;
    }
  );

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFiltersAndRender();
    });
  }

  if (locationFilter) {
    locationFilter.addEventListener("change", () => {
      renderActiveFilterBar(locationFilter.value);
      applyFiltersAndRender();
      syncUrlWithSelectedLocation(locationFilter.value);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      applyFiltersAndRender();
    });
  }

  function applyFiltersAndRender() {
    let filteredPackages = [...allPackages];

    const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedLocation = locationFilter ? locationFilter.value.trim().toLowerCase() : "";
    const selectedSort = sortSelect ? sortSelect.value : "latest";

    if (searchValue) {
      filteredPackages = filteredPackages.filter((pkg) => {
        const title = (pkg.title || "").toLowerCase();
        const location = (pkg.location || "").toLowerCase();
        const description = (pkg.description || "").toLowerCase();

        return (
          title.includes(searchValue) ||
          location.includes(searchValue) ||
          description.includes(searchValue)
        );
      });
    }

    if (selectedLocation) {
      filteredPackages = filteredPackages.filter((pkg) => {
        return (pkg.location || "").trim().toLowerCase() === selectedLocation;
      });
    }

    if (selectedSort === "priceLow") {
      filteredPackages.sort((a, b) => getNumericPrice(a.price) - getNumericPrice(b.price));
    } else if (selectedSort === "priceHigh") {
      filteredPackages.sort((a, b) => getNumericPrice(b.price) - getNumericPrice(a.price));
    } else {
      filteredPackages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    renderPackages(filteredPackages, container);
  }
});

function renderPackages(packages, container) {
  container.innerHTML = "";

  if (!packages.length) {
    container.innerHTML = `
      <div style="
        background:#fff;
        border:1px solid #e2e8f0;
        border-radius:20px;
        padding:24px;
        color:#475569;
        box-shadow:0 10px 28px rgba(15, 23, 42, 0.05);
      ">
        No packages found for the selected filters.
      </div>
    `;
    return;
  }

  packages.forEach((pkg) => {
    const card = createPackageCard(pkg);
    container.appendChild(card);
  });
}

function populateLocationFilter(packages, locationFilter) {
  if (!locationFilter) return;

  const currentValue = locationFilter.value;

  const uniqueLocations = [
    ...new Set(
      packages
        .map((pkg) => (pkg.location || "").trim())
        .filter((location) => location !== "")
    ),
  ].sort((a, b) => a.localeCompare(b));

  locationFilter.innerHTML = `<option value="">All Locations</option>`;

  uniqueLocations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    locationFilter.appendChild(option);
  });

  if ([...locationFilter.options].some((option) => option.value === currentValue)) {
    locationFilter.value = currentValue;
  }
}

function renderActiveFilterBar(location) {
  const existingBar = document.getElementById("activeFilterBar");
  const toolbarWrap = document.querySelector(".packages-toolbar-wrap");
  const toolbarContainer = toolbarWrap?.querySelector(".container");
  const locationFilter = document.getElementById("locationFilter");

  if (!toolbarWrap || !toolbarContainer || !locationFilter) return;

  if (existingBar) {
    existingBar.remove();
  }

  if (!location) return;

  const bar = document.createElement("div");
  bar.id = "activeFilterBar";
  bar.style.marginTop = "10px";

  bar.innerHTML = `
    <div style="
      background:#fff;
      border:1px solid #e2e8f0;
      border-radius:999px;
      padding:10px 14px;
      display:inline-flex;
      align-items:center;
      gap:10px;
      box-shadow:0 8px 20px rgba(15,23,42,0.05);
      flex-wrap:wrap;
    ">
      <span style="color:#475569;">Filtered by:</span>
      <strong style="color:#0f172a;">${escapeHtml(location)}</strong>
      <button
        id="clearLocationFilter"
        type="button"
        style="
          border:none;
          background:#f1f5f9;
          padding:4px 10px;
          border-radius:999px;
          cursor:pointer;
        "
      >
        ✕
      </button>
    </div>
  `;

  toolbarWrap.insertAdjacentElement("afterend", bar);

  document.getElementById("clearLocationFilter")?.addEventListener("click", () => {
    locationFilter.value = "";
    locationFilter.dispatchEvent(new Event("change"));
  });
}

function getNumericPrice(price) {
  if (typeof price === "number") return price;

  if (typeof price === "string") {
    const cleaned = price.replace(/[^\d.]/g, "");
    return Number(cleaned) || 0;
  }

  return 0;
}

function getLocationFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("location") || "";
}

function syncUrlWithSelectedLocation(location) {
  const url = new URL(window.location.href);

  if (location) {
    url.searchParams.set("location", location);
  } else {
    url.searchParams.delete("location");
  }

  window.history.replaceState({}, "", url.toString());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}