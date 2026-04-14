import {
  getVendorBookingRequests,
  updateBookingRequestStatus,
  subscribeToVendorBookingRequests
} from "../services/bookingService.js";
import { requireVendorAuth } from "../utils/authGuard.js";

document.addEventListener("DOMContentLoaded", async () => {
  await requireVendorAuth();
  await loadVendorBookingRequests();
});

async function loadVendorBookingRequests() {
  const list = document.getElementById("bookingRequestsList");
  const message = document.getElementById("bookingRequestsMessage");

  if (!list) {
    console.error("Vendor booking requests page: #bookingRequestsList not found.");
    return;
  }

  try {
    if (message) {
      message.textContent = "Loading booking requests...";
    }

    list.innerHTML = "";

    await subscribeToVendorBookingRequests(
      (requests) => {
        list.innerHTML = "";

        if (requests.length === 0) {
          if (message) {
            message.textContent = "No booking requests found yet.";
          }
          return;
        }

        if (message) {
          message.textContent = "";
        }

        requests.forEach((request) => {
          const card = document.createElement("div");
          card.className = "booking-request-card";

          card.innerHTML = `
            <img
              src="${request.image || "assets/images/kerala-bg.jpg"}"
              alt="${escapeHtml(request.packageName || "Package")}"
              class="booking-request-image"
            />

            <div class="booking-request-content">
              <h3>${escapeHtml(request.packageName || "Package")}</h3>

              <p class="request-meta">
                ${escapeHtml(request.location || "Location not specified")} •
                ${escapeHtml(request.duration || "Duration not specified")} •
                ₹${escapeHtml(String(request.price || "N/A"))}
              </p>

              <div class="request-block">
                <p><strong>Name:</strong> ${escapeHtml(request.fullName || "")}</p>
                <p><strong>Email:</strong> ${escapeHtml(request.email || "")}</p>
                <p><strong>Phone:</strong> ${escapeHtml(request.phone || "")}</p>
                <p><strong>Guests:</strong> ${escapeHtml(String(request.guests || ""))}</p>
                <p><strong>Travel Date:</strong> ${escapeHtml(request.travelDate || "Not provided")}</p>
                <p><strong>Budget:</strong> ${escapeHtml(request.budget || "Not provided")}</p>
                <p><strong>Message:</strong> ${escapeHtml(request.message || "No message")}</p>
              </div>

              <div class="request-status-row">
                <span class="status-badge">${escapeHtml(request.status || "new")}</span>

                <select class="status-select" data-id="${request.id}">
                  <option value="new" ${request.status === "new" ? "selected" : ""}>New</option>
                  <option value="contacted" ${request.status === "contacted" ? "selected" : ""}>Contacted</option>
                  <option value="confirmed" ${request.status === "confirmed" ? "selected" : ""}>Confirmed</option>
                  <option value="closed" ${request.status === "closed" ? "selected" : ""}>Closed</option>
                  <option value="cancelled" ${request.status === "cancelled" ? "selected" : ""}>Cancelled</option>
                </select>

                <button class="btn btn-primary small-btn update-status-btn" data-id="${request.id}">
                  Update
                </button>
              </div>
            </div>
          `;

          list.appendChild(card);
        });

        attachStatusHandlers();
      },
      (error) => {
        console.error("Vendor booking requests subscription error:", error);
        if (message) {
          message.textContent = error.message || "Failed to load booking requests.";
        }
      }
    );
  } catch (error) {
    console.error("Vendor booking requests error:", error);
    if (message) {
      message.textContent = error.message || "Failed to load booking requests.";
    }
  }
}

function attachStatusHandlers() {
  const updateButtons = document.querySelectorAll(".update-status-btn");

  updateButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const requestId = button.dataset.id;
      const select = document.querySelector(`.status-select[data-id="${requestId}"]`);

      if (!select) return;

      try {
        button.disabled = true;
        button.textContent = "Updating...";

        await updateBookingRequestStatus(requestId, select.value);

        button.textContent = "Updated";
        setTimeout(() => {
          button.disabled = false;
          button.textContent = "Update";
        }, 800);
      } catch (error) {
        console.error("Update booking request status error:", error);
        alert(error.message || "Failed to update booking request.");
        button.disabled = false;
        button.textContent = "Update";
      }
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}