import { requireAdminAuth } from "../utils/authGuard.js";
import { db } from "../config/firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let allInquiries = [];

document.addEventListener("DOMContentLoaded", async () => {
  await requireAdminAuth();
  attachFilters();
  await loadAdminInquiries();
});

async function loadAdminInquiries() {
  const grid = document.getElementById("adminInquiriesGrid");
  const summary = document.getElementById("inquirySummary");

  if (!grid || !summary) return;

  try {
    grid.innerHTML = `<div class="admin-empty-state"><p>Loading inquiries...</p></div>`;
    summary.textContent = "Loading inquiries...";

    const inquiryDocs = await fetchAll("inquiries");

    allInquiries = inquiryDocs
      .map((item) => ({
        ...item,
        createdAtMs: toMillis(item.createdAt)
      }))
      .sort((a, b) => b.createdAtMs - a.createdAtMs);

    populateSubjectFilter(allInquiries);
    renderInquiries(getFilteredInquiries());
  } catch (error) {
    console.error("Failed to load admin inquiries:", error);
    grid.innerHTML = `
      <div class="admin-empty-state">
        <p>Failed to load inquiries. ${escapeHtml(error.message || "Unknown error")}</p>
      </div>
    `;
    summary.textContent = "Unable to load inquiries";
  }
}

function renderInquiries(inquiries) {
  const grid = document.getElementById("adminInquiriesGrid");
  const summary = document.getElementById("inquirySummary");

  if (!grid || !summary) return;

  summary.textContent = `Showing ${inquiries.length} inquir${inquiries.length === 1 ? "y" : "ies"}`;

  if (!inquiries.length) {
    grid.innerHTML = `
      <div class="admin-empty-state">
        <p>No inquiries found for the selected filter.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = inquiries
    .map((item) => {
      const name = item.name || item.fullName || "Unknown";
      const email = item.email || "Not provided";
      const phone = item.phone || item.mobile || "Not provided";
      const subject = item.subject || item.topic || "General Inquiry";
      const message = item.message || item.query || item.description || "No message provided.";
      const createdDate = item.createdAtMs
        ? new Date(item.createdAtMs).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
          })
        : "Unknown";

      return `
        <div class="admin-inquiry-card">
          <div class="admin-inquiry-head">
            <div>
              <h3>${escapeHtml(name)}</h3>
              <p>${escapeHtml(createdDate)}</p>
            </div>
            <span class="admin-inquiry-badge">${escapeHtml(subject)}</span>
          </div>

          <div class="admin-inquiry-details">
            <div class="admin-inquiry-row">
              <strong>Email</strong>
              <span>${escapeHtml(email)}</span>
            </div>
            <div class="admin-inquiry-row">
              <strong>Phone</strong>
              <span>${escapeHtml(phone)}</span>
            </div>
            <div class="admin-inquiry-row">
              <strong>Inquiry ID</strong>
              <span>${escapeHtml(item.id)}</span>
            </div>
          </div>

          <p class="admin-inquiry-message">${escapeHtml(message)}</p>

          <div class="admin-inquiry-actions">
            ${
              email !== "Not provided"
                ? `
              <a href="mailto:${encodeURIComponent(email)}" class="admin-action-link email">
                Reply by Email
              </a>
            `
                : ""
            }

            ${
              phone !== "Not provided"
                ? `
              <a href="tel:${escapeAttribute(phone)}" class="admin-action-link call">
                Call Traveler
              </a>
            `
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function attachFilters() {
  const searchInput = document.getElementById("inquirySearch");
  const subjectFilter = document.getElementById("subjectFilter");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderInquiries(getFilteredInquiries());
    });
  }

  if (subjectFilter) {
    subjectFilter.addEventListener("change", () => {
      renderInquiries(getFilteredInquiries());
    });
  }
}

function getFilteredInquiries() {
  const searchValue = (document.getElementById("inquirySearch")?.value || "")
    .trim()
    .toLowerCase();

  const subjectValue = document.getElementById("subjectFilter")?.value || "all";

  return allInquiries.filter((item) => {
    const name = (item.name || item.fullName || "").toLowerCase();
    const email = (item.email || "").toLowerCase();
    const phone = (item.phone || item.mobile || "").toLowerCase();
    const subject = (item.subject || item.topic || "general inquiry").toLowerCase();
    const message = (item.message || item.query || item.description || "").toLowerCase();

    const matchesSearch =
      !searchValue ||
      name.includes(searchValue) ||
      email.includes(searchValue) ||
      phone.includes(searchValue) ||
      subject.includes(searchValue) ||
      message.includes(searchValue);

    const matchesSubject =
      subjectValue === "all" || subject === subjectValue.toLowerCase();

    return matchesSearch && matchesSubject;
  });
}

function populateSubjectFilter(inquiries) {
  const subjectFilter = document.getElementById("subjectFilter");
  if (!subjectFilter) return;

  const subjects = [...new Set(
    inquiries
      .map((item) => item.subject || item.topic || "General Inquiry")
      .map((value) => String(value).trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  subjectFilter.innerHTML = `
    <option value="all">All Subjects</option>
    ${subjects
      .map(
        (subject) =>
          `<option value="${escapeAttribute(subject)}">${escapeHtml(subject)}</option>`
      )
      .join("")}
  `;
}

async function fetchAll(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }));
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (value?.seconds) return value.seconds * 1000;
  return 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}