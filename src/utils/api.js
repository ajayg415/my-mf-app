import { collection, query, where, getDocs, limit } from "firebase/firestore";
import axios from "axios";
import { computeFundMetrics } from "./fundCompution.js";

import { getCachedFund, cacheFundResponse } from "../services/db";
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

/**
 * Smart Fetch:
 * 1. Checks DB for data synced 'Today'.
 * 2. If missing or stale, fetches from API.
 * 3. Stores only the last 30 days of history to save space.
 */
export const fetchFundDetails = async (schemeCode, forceRefresh = false) => {
  if (!schemeCode) return null;

  const todayStr = new Date().toDateString();

  if (!forceRefresh) {
    try {
      const cachedData = await getCachedFund(schemeCode);

      if (cachedData) {
        if (cachedData.meta?.lastSync === todayStr) {
          console.log(`[Cache Hit] ${schemeCode} is up-to-date (Synced: ${todayStr})`);
          if (cachedData.data && cachedData.data.length > 0) {
             computeFundMetrics({
               code: schemeCode,
               data: cachedData.data, 
             });
          }
          return cachedData;
        }
      }
    } catch (err) {
      console.warn("Error reading cache, proceeding to fetch", err);
    }
  }

  try {
    console.log(`[API Call] Fetching ${schemeCode}...`);
    const response = await axios.get(`https://api.mfapi.in/mf/${schemeCode}`);
    const apiResponse = response.data;

    if (apiResponse && apiResponse.meta && apiResponse.data) {

      const optimizedData = {
        meta: {
          ...apiResponse.meta,
          lastSync: todayStr,
        },
        data: apiResponse.data.slice(0, 30), 
      };

      if (apiResponse.data.length > 0) {
        computeFundMetrics({
          code: schemeCode,
          data: apiResponse.data,
        });
      }

      await cacheFundResponse(schemeCode, optimizedData);
      
      return optimizedData;
    }
    return null;

  } catch (error) {
    console.error(`Failed to fetch fund ${schemeCode}:`, error);

    const oldCache = await getCachedFund(schemeCode);
    if (oldCache) {
      console.warn(`[Offline Fallback] Returning stale data for ${schemeCode}`);
      return oldCache;
    }

    return null;
  }
};