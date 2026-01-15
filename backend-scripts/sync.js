const axios = require('axios');
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

// 1. Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const AMFI_URL = "https://www.amfiindia.com/spages/NAVAll.txt";

// Helper to create search keywords (for your frontend search bar)
const createKeywords = (name) => {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9 ]/g, ""); // Remove special chars
  const words = cleanName.split(" ").filter(w => w.length > 2); // Split into words
  return words; 
};

async function syncFunds() {
  console.log("⬇️  Downloading NAVALL.txt...");
  const response = await axios.get(AMFI_URL);
  const data = response.data;
  
  // Split by lines and remove empty ones
  const lines = data.split('\n').filter(line => line.trim() !== "");
  
  console.log(`📊 Found ${lines.length} lines. Parsing...`);

  const batchSize = 500;
  let batch = db.batch();
  let operationCounter = 0;
  let successCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(';');

    // AMFI Format: Code;ISIN_Div_Payout;ISIN_Div_Reinvest;Scheme_Name;NAV;Date
    // Example: 119551;INF209K01157;INF209K01165;Aditya Birla...;100.00;01-Jan-2023
    
    // Skip invalid lines (like headers)
    if (parts.length < 5 || isNaN(parts[0])) continue;

    const schemeCode = parts[0];
    const schemeName = parts[3];
    const isin = parts[1]; // Usually the primary ISIN

    // Define the document to save
    const fundRef = db.collection('funds').doc(schemeCode); // Use Code as ID
    
    const fundData = {
      code: schemeCode,
      name: schemeName,
      isin: isin,
      keywords: createKeywords(schemeName), // Critical for Search!
      category: "Unknown" // AMFI txt doesn't have category, we handle this later
    };

    // Add to batch
    batch.set(fundRef, fundData, { merge: true });
    operationCounter++;

    // Commit every 500 records (Firestore limit)
    if (operationCounter === batchSize) {
      await batch.commit();
      console.log(`✅ Saved ${i} funds...`);
      batch = db.batch(); // Reset batch
      operationCounter = 0;
    }
    successCount++;
  }

  // Commit any remaining
  if (operationCounter > 0) {
    await batch.commit();
  }

  console.log(`🎉 Success! Synced ${successCount} funds to Firestore.`);
}

syncFunds();