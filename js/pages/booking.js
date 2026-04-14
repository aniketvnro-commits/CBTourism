import { getPackageById } from "../services/packageService.js";
import { saveBookingRequest } from "../services/bookingService.js";

let selectedPackage = null;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const packageId = params.get("id");

  const form = document.getElementById("bookingRequestForm");
  const messageBox = document.getElementById("bookingFormMessage");
  const submitBtn = document.getElementById("submitBookingBtn");

  if (!messageBox) {
    console.error("Booking page: #bookingFormMessage not found.");
  }

  if (!packageId) {
    showMessage(messageBox, "error", "Invalid package. Please return and select a package again.");
    disableForm();
    return;
  }

  try {
    selectedPackage = await getPackageById(packageId);

    if ((selectedPackage.status || "").toLowerCase() !== "active") {
      showMessage(messageBox, "error", "This package is currently unavailable for booking.");
      disableForm();
      return;
    }

    fillPackageDetails(selectedPackage);
    applyHeroBackground(selectedPackage);
  } catch (error) {
    console.error("Load booking package error:", error);
    showMessage(messageBox, "error", error.message || "Failed to load package.");
    disableForm();
    return;
  }

  if (!form || !submitBtn) {
    console.error("Booking page: form or submit button not found.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!selectedPackage) {
      showMessage(messageBox, "error", "Package data is missing.");
      return;
    }

    const fullNameEl = document.getElementById("fullName");
    const emailEl = document.getElementById("email");
    const phoneEl = document.getElementById("phone");
    const guestsEl = document.getElementById("guests");
    const travelDateEl = document.getElementById("travelDate");
    const budgetEl = document.getElementById("budget");
    const messageEl = document.getElementById("message");

    if (
      !fullNameEl ||
      !emailEl ||
      !phoneEl ||
      !guestsEl ||
      !travelDateEl ||
      !budgetEl ||
      !messageEl
    ) {
      showMessage(messageBox, "error", "Booking form is incomplete.");
      return;
    }

    const bookingData = {
      packageId: selectedPackage.id,
      vendorId: selectedPackage.vendorId,
      packageName: selectedPackage.title || "",
      location: selectedPackage.location || "",
      duration: selectedPackage.duration || "",
      price: selectedPackage.price || "",
      image: selectedPackage.image || "",

      fullName: fullNameEl.value.trim(),
      email: emailEl.value.trim(),
      phone: phoneEl.value.trim(),
      guests: guestsEl.value.trim(),
      travelDate: travelDateEl.value,
      budget: budgetEl.value,
      message: messageEl.value.trim()
    };

    clearMessage(messageBox);

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      await saveBookingRequest(bookingData);

      showMessage(
        messageBox,
        "success",
        "Booking request submitted successfully. The vendor will review your request."
      );

      form.reset();
      fillReadonlyFields(selectedPackage);
    } catch (error) {
      console.error("Booking submit error:", error);
      showMessage(
        messageBox,
        "error",
        error.message || "Failed to submit booking request."
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Booking Request";
    }
  });
});

function fillPackageDetails(pkg) {
  const packageTitleEl = document.getElementById("bookingPackageTitle");
  const packageLocationEl = document.getElementById("bookingPackageLocation");
  const packageDurationEl = document.getElementById("bookingPackageDuration");
  const packagePriceEl = document.getElementById("bookingPackagePrice");
  const packageImageEl = document.getElementById("bookingPackageImage");
  const packageDescriptionEl = document.getElementById("bookingPackageDescription");

  if (packageTitleEl) packageTitleEl.textContent = pkg.title || "Travel Package";
  if (packageLocationEl) packageLocationEl.textContent = pkg.location || "—";
  if (packageDurationEl) packageDurationEl.textContent = pkg.duration || "—";
  if (packagePriceEl) packagePriceEl.textContent = pkg.price ? `₹${pkg.price}` : "—";
  if (packageImageEl) packageImageEl.src = pkg.image || "assets/images/kerala-bg.jpg";

  if (packageDescriptionEl) {
    packageDescriptionEl.textContent =
      pkg.description || "Your selected package summary will appear here.";
  }

  fillReadonlyFields(pkg);
}

function fillReadonlyFields(pkg) {
  const packageNameInput = document.getElementById("packageName");
  const locationInput = document.getElementById("location");
  const priceInput = document.getElementById("price");

  if (packageNameInput) packageNameInput.value = pkg.title || "";
  if (locationInput) locationInput.value = pkg.location || "";
  if (priceInput) priceInput.value = pkg.price ? `₹${pkg.price}` : "";
}

function applyHeroBackground(pkg) {
  const hero = document.querySelector(".booking-hero");
  if (!hero) return;

  const imageUrl = pkg.image || "assets/images/kerala-bg.jpg";

  hero.style.background = `
    linear-gradient(rgba(15, 23, 42, 0.58), rgba(15, 23, 42, 0.58)),
    url("${imageUrl}") center/cover no-repeat
  `;
}

function disableForm() {
  const form = document.getElementById("bookingRequestForm");
  const submitBtn = document.getElementById("submitBookingBtn");

  if (form) {
    const fields = form.querySelectorAll("input, select, textarea, button");
    fields.forEach((field) => {
      field.disabled = true;
    });
  }

  if (submitBtn) {
    submitBtn.textContent = "Unavailable";
  }
}

function showMessage(element, type, text) {
  if (!element) return;
  element.className = `booking-message ${type}`;
  element.textContent = text;
}

function clearMessage(element) {
  if (!element) return;
  element.className = "booking-message";
  element.textContent = "";
}