import { addPackage } from "../services/packageService.js";
import { requireVendorAuth } from "../utils/authGuard.js";

document.addEventListener("DOMContentLoaded", async () => {
  await requireVendorAuth();

  const packageForm = document.getElementById("packageForm");
  const formMessage = document.getElementById("formMessage");
  const imageInput = document.getElementById("image");
  const imagePreview = document.getElementById("imagePreview");

  if (!packageForm || !formMessage || !imageInput || !imagePreview) {
    console.error("Vendor add package page: required DOM elements not found.");
    return;
  }

  let currentPreviewUrl = "";

  imageInput.addEventListener("change", () => {
    const file = imageInput.files?.[0];

    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      currentPreviewUrl = "";
    }

    if (!file) {
      imagePreview.src = "";
      imagePreview.style.display = "none";
      return;
    }

    currentPreviewUrl = URL.createObjectURL(file);
    imagePreview.src = currentPreviewUrl;
    imagePreview.style.display = "block";
  });

  packageForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title")?.value.trim();
    const location = document.getElementById("location")?.value.trim();
    const duration = document.getElementById("duration")?.value.trim();
    const price = document.getElementById("price")?.value.trim();
    const description = document.getElementById("description")?.value.trim();
    const imageFile = imageInput.files?.[0];

    try {
      formMessage.textContent = "Uploading package and image...";

      await addPackage({
        title,
        location,
        duration,
        price,
        description,
        imageFile
      });

      formMessage.textContent = "Package added successfully.";

      packageForm.reset();

      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        currentPreviewUrl = "";
      }

      imagePreview.src = "";
      imagePreview.style.display = "none";
    } catch (error) {
      console.error("Add package error:", error);
      formMessage.textContent = error.message || "Failed to add package.";
    }
  });
});