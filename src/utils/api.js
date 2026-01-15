import { db } from "../config/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

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