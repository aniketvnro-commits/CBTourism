import { saveInquiry } from "../services/inquiryService.js";

document.addEventListener("DOMContentLoaded", () => {
  autoFillPackageFromUrl();

  const form = document.getElementById("contactInquiryForm");
  const messageBox = document.getElementById("contactFormMessage");
  const submitBtn = document.getElementById("submitInquiryBtn");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inquiryData = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      guests: document.getElementById("guests").value.trim(),
      packageName: document.getElementById("packageName").value.trim(),
      travelDate: document.getElementById("travelDate").value,
      budget: document.getElementById("budget").value,
      inquiryType: document.getElementById("inquiryType").value,
      message: document.getElementById("message").value.trim()
    };

    clearMessage(messageBox);

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      await saveInquiry(inquiryData);

      showMessage(messageBox, "success", "Inquiry submitted successfully. We’ll reach out to you soon.");
      form.reset();
      autoFillPackageFromUrl();
    } catch (error) {
      console.error("Inquiry submit error:", error);
      showMessage(messageBox, "error", error.message || "Failed to submit inquiry.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Inquiry";
    }
  });
});

function autoFillPackageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const packageName = params.get("package");
  const packageField = document.getElementById("packageName");

  if (packageName && packageField) {
    packageField.value = packageName;
  }
}

function showMessage(element, type, text) {
  element.className = `contact-message ${type}`;
  element.textContent = text;
}

function clearMessage(element) {
  element.className = "contact-message";
  element.textContent = "";
}