import { app, db } from "../config/firebase-config.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);

function waitForUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function saveBookingRequest(bookingData) {
  const {
    packageId,
    vendorId,
    packageName,
    location,
    duration,
    price,
    image,
    fullName,
    email,
    phone,
    guests,
    travelDate,
    budget,
    message
  } = bookingData;

  if (!fullName || !email || !phone) {
    throw new Error("Name, email, and phone are required.");
  }

  if (!packageId || !vendorId || !packageName) {
    throw new Error("Package information is missing.");
  }

  await addDoc(collection(db, "booking_requests"), {
    packageId,
    vendorId,
    packageName,
    location: location || "",
    duration: duration || "",
    price: price || "",
    image: image || "",

    fullName,
    email,
    phone,
    guests: guests || "",
    travelDate: travelDate || "",
    budget: budget || "",
    message: message || "",

    status: "new",
    createdAt: Date.now()
  });
}

async function getVendorBookingRequests() {
  const user = auth.currentUser || await waitForUser();

  if (!user) {
    throw new Error("No logged-in vendor found.");
  }

  const q = query(
    collection(db, "booking_requests"),
    where("vendorId", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  const requests = [];
  snapshot.forEach((docItem) => {
    requests.push({
      id: docItem.id,
      ...docItem.data()
    });
  });

  requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return requests;
}

async function updateBookingRequestStatus(requestId, status) {
  const user = auth.currentUser || await waitForUser();

  if (!user) {
    throw new Error("No logged-in vendor found.");
  }

  const requestRef = doc(db, "booking_requests", requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error("Booking request not found.");
  }

  const requestData = requestSnap.data();

  if (requestData.vendorId !== user.uid) {
    throw new Error("You are not allowed to update this booking request.");
  }

  await updateDoc(requestRef, {
    status,
    updatedAt: Date.now()
  });
}

function subscribeToVendorBookingRequests(onData, onError) {
  return (async () => {
    const user = auth.currentUser || await waitForUser();

    if (!user) {
      throw new Error("No logged-in vendor found.");
    }

    const q = query(
      collection(db, "booking_requests"),
      where("vendorId", "==", user.uid)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const requests = [];

        snapshot.forEach((docItem) => {
          requests.push({
            id: docItem.id,
            ...docItem.data()
          });
        });

        requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onData(requests);
      },
      (error) => {
        console.error("Booking requests subscription error:", error);
        if (onError) onError(error);
      }
    );
  })();
}

export {
  saveBookingRequest,
  getVendorBookingRequests,
  updateBookingRequestStatus,
  subscribeToVendorBookingRequests
};