import { collection, query, where, getDocs, limit } from "firebase/firestore";
import axios from "axios";
import { computeFundMetrics } from "./fundCompution.js";

import { db } from "../config/firebase";

// API Endpoint for MFAPI.in
const MF_NAV_URL = "https://api.mfapi.in/mf";

export const searchFunds = async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 3) return [];

  // Convert user input to lowercase to match our keyword logic
  const cleanTerm = searchTerm.toLowerCase().trim();

  // Reference the 'funds' collection
  const fundsRef = collection(db, "funds");

  // Query: Find documents where 'keywords' array contains the specific word
  // Note: Firestore 'array-contains' looks for EXACT matches in the array.
  // So 'hdfc' works, but 'hdf' might not match unless we added partials.
  const q = query(
    fundsRef,
    where("keywords", "array-contains", cleanTerm),
    limit(10) // Only get top 10 results to save bandwidth
  );

  try {
    const querySnapshot = await getDocs(q);

    // Transform the weird Firestore format into a clean Array
    const results = querySnapshot.docs.map((doc) => ({
      id: doc.id, // This is the Scheme Code (e.g., 122639)
      ...doc.data(), // Name, ISIN, etc.
    }));

    return results;
  } catch (error) {
    console.error("Error searching funds:", error);
    return [];
  }
};

/**
 * Fetches a single fund by its ISIN (International Securities Identification Number)
 * This is 100% accurate and faster than name search.
 */
export const getFundByISIN = async (isin) => {
  if (!isin) return null;

  // 1. Clean the input (ISINs are always Uppercase and 12 chars)
  const cleanISIN = isin.trim().toUpperCase();

  const fundsRef = collection(db, "funds");

  // 2. Exact Match Query
  const q = query(
    fundsRef,
    where("isin", "==", cleanISIN),
    limit(1) // We only expect one result
  );

  try {
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(`No fund found for ISIN: ${cleanISIN}`);
      return null;
    }

    // 3. Return the first match
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error fetching fund by ISIN:", error);
    return null;
  }
};

export const getLatestNav = async (schemeCode) => {
  try {
    const response = await axios.get(`${MF_NAV_URL}/${schemeCode}`);
    if (response.data && response.data.data && response.data.data.length > 0) {
      computeFundMetrics({
        code: schemeCode,
        nav: parseFloat(response.data.data[0].nav),
      });
    }
  } catch (error) {
    console.error(`Failed to fetch NAV for ${schemeCode}`, error);
  }
};
