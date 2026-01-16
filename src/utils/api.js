import { collection, query, where, getDocs, limit } from "firebase/firestore";
import axios from 'axios';
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
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,       // This is the Scheme Code (e.g., 122639)
      ...doc.data()     // Name, ISIN, etc.
    }));

    return results;
  } catch (error) {
    console.error("Error searching funds:", error);
    return [];
  }
};


export const getFundsByName = async (partialName) => {
  if (!partialName) return [];

  const searchTerms = partialName.toLowerCase().split(" "); // Split "Axis Bluechip" -> ["axis", "bluechip"]
  const fundsRef = collection(db, "funds");

  // Note: Firestore can only handle one 'array-contains' per query.
  // We search for the FIRST word, then filter the rest in Javascript (Client-side)
  const q = query(
    fundsRef, 
    where("keywords", "array-contains", searchTerms[0]), 
    limit(20)
  );

  try {
    const snapshot = await getDocs(q);
    
    // Client-side filtering for remaining words
    const funds = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(fund => {
         // Check if ALL typed words exist in the fund's keyword list
         return searchTerms.every(term => fund.keywords.includes(term));
      });
    console.log({funds});
    return funds;
  } catch (error) {
    console.error("Error fetching funds:", error);
    return [];
  }
};



export const getLatestNav = async (schemeCode) => {
  try {
    const response = await axios.get(`${MF_NAV_URL}/${schemeCode}`);
    if (response.data && response.data.data && response.data.data.length > 0) {
      computeFundMetrics({
        code: schemeCode,
        nav: parseFloat(response.data.data[0].nav)
      });
    }
  } catch (error) {
    console.error(`Failed to fetch NAV for ${schemeCode}`, error);
  }
};
