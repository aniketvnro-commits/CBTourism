import { getPackageById, updatePackage } from "../services/packageService.js";
import { requireVendorAuth } from "../utils/authGuard.js";

document.addEventListener("DOMContentLoaded", async () => {
  await requireVendorAuth();

  const form = document.getElementById("editPackageForm");
  const message = document.getElementById("editPackageMessage");
  const updateBtn = document.getElementById("updatePackageBtn");
  const currentImage = document.getElementById("currentPackageImage");
  const newImagePreview = document.getElementById("newPackageImagePreview");
  const imageInput = document.getElementById("image");

  if (!form || !message || !updateBtn || !currentImage || !newImagePreview || !imageInput) {
    console.error("Edit package page: required DOM elements not found.");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const packageId = params.get("id");

  if (!packageId) {
    message.textContent = "Invalid package ID.";
    message.style.color = "red";
    form.style.display = "none";
    return;
  }

  let previewUrl = "";

  imageInput.addEventListener("change", () => {
    const file = imageInput.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = "";
    }

    if (!file) {
      newImagePreview.src = "";
      newImagePreview.style.display = "none";
      return;
    }

    previewUrl = URL.createObjectURL(file);
    newImagePreview.src = previewUrl;
    newImagePreview.style.display = "block";
  });

  try {
    message.textContent = "Loading package...";

    const pkg = await getPackageById(packageId);

    document.getElementById("title").value = pkg.title || "";
    document.getElementById("location").value = pkg.location || "";
    document.getElementById("duration").value = pkg.duration || "";
    document.getElementById("price").value = pkg.price || "";
    document.getElementById("description").value = pkg.description || "";

    if (pkg.image) {
      currentImage.src = pkg.image;
      currentImage.style.display = "block";
    }

    message.textContent = "";
  } catch (error) {
    console.error("Load package error:", error);
    message.textContent = error.message || "Failed to load package.";
    message.style.color = "red";
    form.style.display = "none";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const location = document.getElementById("location").value.trim();
    const duration = document.getElementById("duration").value.trim();
    const price = document.getElementById("price").value.trim();
    const description = document.getElementById("description").value.trim();
    const imageFile = imageInput.files?.[0];

    try {
      updateBtn.disabled = true;
      updateBtn.textContent = "Updating...";
      message.textContent = "";

      await updatePackage(packageId, {
        title,
        location,
        duration,
        price,
        description,
        imageFile
      });

      message.textContent = "Package updated successfully.";
      message.style.color = "green";

      setTimeout(() => {
        window.location.href = "vendor-packages.html";
      }, 1000);
    } catch (error) {
      console.error("Update package error:", error);
      message.textContent = error.message || "Failed to update package.";
      message.style.color = "red";
    } finally {
      updateBtn.disabled = false;
      updateBtn.textContent = "Update Package";
    }
  });
});