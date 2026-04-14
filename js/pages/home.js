import { subscribeToActivePackages } from "../services/packageService.js";
import { createPackageCard } from "../modules/packageCard.js";

document.addEventListener("DOMContentLoaded", () => {
  initHero();
  renderHomepagePackages();
});


// ================= HERO SECTION =================

function initHero() {
  const slides = [
    {
      title: "KERALA",
      tag: "Community Based Tourism",
      description:
        "Explore lush landscapes, local culture, village life, and authentic travel experiences.",
      bg: "assets/images/kerala-bg.jpg",
      cards: [
        "assets/images/card-kerala-1.jpg",
        "assets/images/card-kerala-2.jpg",
        "assets/images/card-kerala-3.jpg",
      ],
    },
    {
      title: "UTTARAKHAND",
      tag: "Community Based Tourism",
      description:
        "Discover mountain stays, spiritual retreats, and local village tourism.",
      bg: "assets/images/uttarakhand-bg.jpg",
      cards: [
        "assets/images/card-uttarakhand-1.jpg",
        "assets/images/card-uttarakhand-2.jpg",
        "assets/images/card-uttarakhand-3.jpg",
      ],
    },
    {
      title: "RAJASTHAN",
      tag: "Community Based Tourism",
      description:
        "Experience heritage villages, crafts, and desert tourism.",
      bg: "assets/images/rajasthan-bg.jpg",
      cards: [
        "assets/images/card-rajasthan-1.jpg",
        "assets/images/card-rajasthan-2.jpg",
        "assets/images/card-rajasthan-3.jpg",
      ],
    },
  ];

  let current = 0;
  let autoSlide;

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const heroBg = document.getElementById("heroBg");
  const heroTag = document.getElementById("heroTag");
  const heroTitle = document.getElementById("heroTitle");
  const heroDesc = document.getElementById("heroDescription");
  const heroButtons = document.querySelector(".hero-buttons");

  const heroContent = document.querySelector(".hero-content");
  const heroLeft = document.querySelector(".hero-left");
  const heroRight = document.querySelector(".hero-right");

  const card1 = document.getElementById("card1Img");
  const card2 = document.getElementById("card2Img");
  const card3 = document.getElementById("card3Img");
  const cards = [card1, card2, card3];

  const dots = document.querySelectorAll(".dot");
  const progressBar = document.getElementById("heroProgress"); // optional

  // ── Helpers ───────────────────────────────────────────────────────────────

  function animateText(el) {
    if (!el) return;
    el.classList.remove("text-entering");
    void el.offsetWidth;
    el.classList.add("text-entering");
  }

  function animateCard(el) {
    if (!el) return;
    el.classList.remove("card-entering");
    void el.offsetWidth;
    el.classList.add("card-entering");
  }

  function resetProgress() {
    if (!progressBar) return;
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    void progressBar.offsetWidth;
    progressBar.style.transition = "width 5s linear";
    progressBar.style.width = "100%";
  }

  // ✅ AUTO ADJUSTMENT LOGIC
  function adjustHeroText() {
    if (!heroContent || !heroLeft || !heroRight || !heroTitle) return;

    // On smaller screens, let CSS handle layout naturally
    if (window.innerWidth <= 992) {
      heroLeft.style.maxWidth = "";
      heroTitle.style.fontSize = "";
      heroTitle.style.lineHeight = "";
      return;
    }

    const contentRect = heroContent.getBoundingClientRect();
    const rightRect = heroRight.getBoundingClientRect();

    // Space to keep between title/text block and right cards
    const gap = 40;

    const availableWidth = Math.max(
      320,
      rightRect.left - contentRect.left - gap
    );

    heroLeft.style.maxWidth = `${availableWidth}px`;

    // Reset title styles before recalculating
    heroTitle.style.fontSize = "";
    heroTitle.style.lineHeight = "";

    // Shrink title only if needed
    requestAnimationFrame(() => {
      let fontSize = parseFloat(window.getComputedStyle(heroTitle).fontSize);
      let attempts = 0;

      while (
        heroTitle.scrollWidth > availableWidth &&
        fontSize > 48 &&
        attempts < 40
      ) {
        fontSize -= 2;
        heroTitle.style.fontSize = `${fontSize}px`;
        heroTitle.style.lineHeight = "1";
        attempts++;
      }
    });
  }

  // ── Core slide updater ────────────────────────────────────────────────────
  function updateSlide(index) {
    const slide = slides[index];

    heroBg.src = slide.bg;

    heroTag.textContent = slide.tag;
    heroTitle.textContent = slide.title;
    heroDesc.textContent = slide.description;

    animateText(heroTag);
    animateText(heroTitle);
    animateText(heroDesc);
    animateText(heroButtons);

    cards.forEach((card, i) => {
      card.src = slide.cards[i];
      animateCard(card.closest(".preview-card") || card.parentElement);
    });

    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));

    resetProgress();

    // Run adjustment after content updates
    requestAnimationFrame(() => {
      adjustHeroText();
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function goTo(index) {
    current = (index + slides.length) % slides.length;
    updateSlide(current);
  }

  function nextSlide() {
    goTo(current + 1);
  }

  function prevSlide() {
    goTo(current - 1);
  }

  function startAutoSlide() {
    clearInterval(autoSlide);
    autoSlide = setInterval(nextSlide, 5000);
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  document.getElementById("nextSlide")?.addEventListener("click", () => {
    nextSlide();
    startAutoSlide();
  });

  document.getElementById("prevSlide")?.addEventListener("click", () => {
    prevSlide();
    startAutoSlide();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goTo(Number(dot.dataset.index));
      startAutoSlide();
    });
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      adjustHeroText();
    }, 120);
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  updateSlide(current);
  startAutoSlide();
}


// ================= PACKAGES =================

function renderHomepagePackages() {
  const container = document.getElementById("homepagePackageGrid");

  if (!container) return;

  container.innerHTML = "<p>Loading packages...</p>";

  subscribeToActivePackages(
    (packages) => {
      container.innerHTML = "";

      if (!packages.length) {
        container.innerHTML = "<p>No packages available yet.</p>";
        return;
      }

      packages.forEach((pkg) => {
        const card = createPackageCard(pkg);
        container.appendChild(card);
      });
    },
    (error) => {
      console.error("Homepage package error:", error);
      container.innerHTML = `<p>Error: ${error.message}</p>`;
    }
  );
}