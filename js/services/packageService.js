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
  deleteDoc,
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
      resolve(user || null);
    });
  });
}

function normalizePackageList(snapshot) {
  const packages = [];

  snapshot.forEach((docItem) => {
    packages.push({
      id: docItem.id,
      ...docItem.data()
    });
  });

  packages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return packages;
}

async function uploadPackageImage(file) {
  const cloudName = "dx6f8mcxf";
  const uploadPreset = "ml_default";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error(data.error?.message || "Image upload failed.");
  }

  return data.secure_url;
}

async function addPackage({
  title,
  location,
  duration,
  price,
  description,
  imageFile
}) {
  const user = auth.currentUser || await waitForUser();

  if (!user) {
    throw new Error("No logged-in vendor found. Please log in first.");
  }

  if (!title || !location || !duration || !price) {
    throw new Error("Please fill all required package fields.");
  }

  if (!imageFile) {
    throw new Error("Please select a package image.");
  }

  const imageUrl = await uploadPackageImage(imageFile);

  const docRef = await addDoc(collection(db, "packages"), {
    vendorId: user.uid,
    title,
    location,
    duration,
    price,
    description: description || "",
    image: imageUrl,
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  return docRef;
}

async function getVendorPackages() {
  const user = auth.currentUser || await waitForUser();

  if (!user) {
    throw new Error("No logged-in vendor found.");
  }

  const q = query(
    collection(db, "packages"),
    where("vendorId", "==", user.uid)
  );

  const snapshot = await getDocs(q);
  return normalizePackageList(snapshot);
}

async function getAllActivePackages() {
  const q = query(
    collection(db, "packages"),
    where("status", "==", "active")
  );

  const snapshot = await getDocs(q);
  return normalizePackageList(snapshot);
}

function subscribeToActivePackages(onData, onError) {
  const q = query(
    collection(db, "packages"),
    where("status", "==", "active")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(normalizePackageList(snapshot));
    },
    (error) => {
      console.error("Active packages subscription error:", error);
      if (typeof onError === "function") {
        onError(error);
      }
    }
  );
}

async function subscribeToVendorPackages(onData, onError) {
  const user = auth.currentUser || await waitForUser();

  if (!user) {
    throw new Error("No logged-in vendor found.");
  }

  const q = query(
    collection(db, "packages"),
    where("vendorId", "==", user.uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(normalizePackageList(snapshot));
    },
    (error) => {
      console.error("Vendor packages subscription error:", error);
      if (typeof onError === "function") {
        onError(error);
      }
    }
  );
}

async function getPackageById(packageId) {
  const packageRef = doc(db, "packages", packageId);
  const snapshot = await getDoc(packageRef);

  if (!snapshot.exists()) {
    throw new Error("Package not found.");
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

async function updatePackage(
  packageId,
  {
    title,
    location,
    duration,
    price,
    description,
    imageFile
  }
) {
  const user = auth.currentUser || await waitForUser();

  if (!user) {
    throw new Error("No logged-in vendor found.");
  }

  const packageRef = doc(db, "packages", packageId);
  const packageSnap = await getDoc(packageRef);

  if (!packageSnap.exists()) {
    throw new Error("Package not found.");
  }

  const existingPackage = packageSnap.data();

  if (existingPackage.vendorId !== user.uid) {
    throw new Error("You are not allowed to edit this package.");
  }

  const updatedData = {
    title,
    location,
    duration,
    price,
    description: description || "",
    updatedAt: Date.now()
  };

  if (imageFile) {
    const imageUrl = await uploadPackageImage(imageFile);
    updatedData.image = imageUrl;
  }

  await updateDoc(packageRef, updatedData);
}

async function deletePackage(packageId) {
  const user = auth.currentUser || await waitForUser();

  if (!user) {
    throw new Error("No logged-in vendor found.");
  }

  const packageRef = doc(db, "packages", packageId);
  const packageSnap = await getDoc(packageRef);

  if (!packageSnap.exists()) {
    throw new Error("Package not found.");
  }

  const packageData = packageSnap.data();

  if (packageData.vendorId !== user.uid) {
    throw new Error("You are not allowed to delete this package.");
  }

  await deleteDoc(packageRef);
}

export {
  addPackage,
  getVendorPackages,
  getAllActivePackages,
  subscribeToActivePackages,
  subscribeToVendorPackages,
  getPackageById,
  updatePackage,
  deletePackage
};