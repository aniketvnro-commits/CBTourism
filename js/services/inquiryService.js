import { db } from "../config/firebase-config.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function saveInquiry(inquiryData) {
  const {
    fullName,
    email,
    phone,
    guests,
    packageName,
    travelDate,
    budget,
    inquiryType,
    message
  } = inquiryData;

  if (!fullName || !email || !phone) {
    throw new Error("Name, email, and phone are required.");
  }

  await addDoc(collection(db, "inquiries"), {
    fullName,
    email,
    phone,
    guests: guests || "",
    packageName: packageName || "",
    travelDate: travelDate || "",
    budget: budget || "",
    inquiryType: inquiryType || "booking_request",
    message: message || "",
    status: "new",
    createdAt: Date.now()
  });
}

export { saveInquiry };