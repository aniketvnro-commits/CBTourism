export function createPackageCard(pkg) {
  const card = document.createElement("div");
  card.className = "package-card-modern";

  card.innerHTML = `
    <div class="package-card-image-wrap">
      <img src="${pkg.image}" alt="${pkg.title}" />
    </div>

    <div class="package-card-body">
      <h3 class="package-card-title">${pkg.title}</h3>

      <p class="package-card-meta">
        ${pkg.duration} • ${pkg.location} • ₹${pkg.price}
      </p>

      <p class="package-card-desc">
        ${pkg.description}
      </p>

      <a href="package-details.html?id=${pkg.id}" 
         class="btn btn-primary small-btn">
         View Details
      </a>
    </div>
  `;

  return card;
}