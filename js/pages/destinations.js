import { subscribeToActivePackages } from "../services/packageService.js";

const destinationMeta = {
  munnar: {
    title: "Munnar",
    image: "assets/images/kerala-bg.jpg",
    description: "Tea gardens, cool hills, scenic valleys, and immersive mountain experiences."
  },
  alleppey: {
    title: "Alleppey",
    image: "assets/images/kerala-bg.jpg",
    description: "Backwaters, houseboats, village life, and slow travel through Kerala waterways."
  },
  wayanad: {
    title: "Wayanad",
    image: "assets/images/kerala-bg.jpg",
    description: "Forest trails, waterfalls, plantations, and nature-led stays."
  },
  thekkady: {
    title: "Thekkady",
    image: "assets/images/kerala-bg.jpg",
    description: "Wildlife, spice plantations, eco-tourism, and adventurous escapes."
  },
  varkala: {
    title: "Varkala",
    image: "assets/images/kerala-bg.jpg",
    description: "Cliffside views, beaches, cafes, and peaceful coastal experiences."
  },
  kovalam: {
    title: "Kovalam",
    image: "assets/images/kerala-bg.jpg",
    description: "Coastal relaxation, beach experiences, and traveler-friendly leisure packages."
  },
  kumarakom: {
    title: "Kumarakom",
    image: "assets/images/kerala-bg.jpg",
    description: "Birdlife, backwater beauty, and serene village-centered travel."
  },
  athirappilly: {
    title: "Athirappilly",
    image: "assets/images/kerala-bg.jpg",
    description: "Waterfalls, greenery, and refreshing nature-based tourism experiences."
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("destinationsGrid");
  const message = document.getElementById("destinationsMessage");
  const searchInput = document.getElementById("destinationSearch");

  if (!grid || !message) {
    console.error("Destinations page: required DOM elements not found.");
    return;
  }

  let allDestinations = [];

  subscribeToActivePackages(
    (packages) => {
      allDestinations = buildDestinationsFromPackages(packages);
      renderDestinations(allDestinations, grid, message, searchInput?.value || "");
    },
    (error) => {
      console.error("Destinations subscription error:", error);
      message.textContent = error.message || "Failed to load destinations.";
      grid.innerHTML = "";
    }
  );

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderDestinations(allDestinations, grid, message, searchInput.value);
    });
  }
});

function buildDestinationsFromPackages(packages) {
  const grouped = new Map();

  packages.forEach((pkg) => {
    const rawLocation = String(pkg.location || "").trim();
    if (!rawLocation) return;

    const key = normalizeLocationKey(rawLocation);

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        location: prettifyLocation(rawLocation),
        packageCount: 0,
        packages: []
      });
    }

    const entry = grouped.get(key);
    entry.packageCount += 1;
    entry.packages.push(pkg);
  });

  return Array.from(grouped.values())
    .map((entry) => {
      const meta = destinationMeta[entry.key] || {};
      return {
        key: entry.key,
        title: meta.title || entry.location,
        image: meta.image || getFallbackImage(entry.packages),
        description:
          meta.description ||
          `Explore community-based tourism experiences in ${entry.location} through live vendor packages.`,
        packageCount: entry.packageCount,
        location: entry.location
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function renderDestinations(destinations, grid, message, searchValue) {
  const normalizedSearch = String(searchValue || "").trim().toLowerCase();

  const filtered = normalizedSearch
    ? destinations.filter((destination) =>
        destination.title.toLowerCase().includes(normalizedSearch)
      )
    : destinations;

  grid.innerHTML = "";

  if (!destinations.length) {
    message.textContent = "";
    grid.innerHTML = `
      <div class="destinations-empty">
        No destinations are available yet. Once vendors add active packages with locations,
        destinations will appear here automatically.
      </div>
    `;
    return;
  }

  if (!filtered.length) {
    message.textContent = "";
    grid.innerHTML = `
      <div class="destinations-empty">
        No destinations matched your search. Try another location name.
      </div>
    `;
    return;
  }

  message.textContent = `${filtered.length} destination${filtered.length === 1 ? "" : "s"} available`;

  filtered.forEach((destination) => {
    const card = document.createElement("article");
    card.className = "destination-card";

    card.innerHTML = `
      <div class="destination-card-image-wrap">
        <img
          class="destination-card-image"
          src="${escapeHtml(destination.image)}"
          alt="${escapeHtml(destination.title)}"
        />
        <span class="destination-card-count">
          ${destination.packageCount} package${destination.packageCount === 1 ? "" : "s"}
        </span>
      </div>

      <div class="destination-card-body">
        <h3 class="destination-card-title">${escapeHtml(destination.title)}</h3>
        <p class="destination-card-sub">${escapeHtml(destination.description)}</p>

        <div class="destination-card-meta">
          <span>${escapeHtml(destination.location)}</span>
          <span>Live inventory</span>
        </div>

        <div class="destination-card-actions">
          <a
            href="packages.html?location=${encodeURIComponent(destination.location)}"
            class="btn btn-primary"
          >
            Explore Packages
          </a>
          <a
            href="packages.html?location=${encodeURIComponent(destination.location)}"
            class="btn btn-outline"
          >
            View All
          </a>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function normalizeLocationKey(location) {
  return String(location)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/,\s*kerala$/i, "")
    .trim();
}

function prettifyLocation(location) {
  return String(location)
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getFallbackImage(packages) {
  const pkgWithImage = packages.find((pkg) => pkg.image);
  return pkgWithImage?.image || "assets/images/kerala-bg.jpg";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}