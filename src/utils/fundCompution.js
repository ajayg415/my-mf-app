import { store } from "../store/store";
import { getFundByISIN } from "./api.js";
import { updateAllFunds } from "../store/mf/mfSlice.js";

export const calculateFundValue = (units, nav) => {
  return parseFloat(units) * nav;
};

export const calculateProfitLoss = (currentValue, costValue) => {
  return currentValue - parseFloat(costValue);
};

export const calculateProfitLossPercentage = (gainLoss, costValue) => {
  if (parseFloat(costValue) === 0) return 0;
  return (gainLoss / parseFloat(costValue)) * 100;
};

export const computeFundMetrics = ({ nav, code }) => {
  const state = store.getState();
  const funds = state.mf?.userData?.funds || [];

  const updatedFunds = funds.map((fund) => {
    if (fund.code === code) {
      return {
        ...fund,
        nav,
        currentMktValue: calculateFundValue(fund.units, nav),
        gainLoss: calculateProfitLoss(
          calculateFundValue(fund.units, nav),
          fund.costValue
        ),
        gainLossPercentage: calculateProfitLossPercentage(
          calculateProfitLoss(
            calculateFundValue(fund.units, nav),
            fund.costValue
          ),
          fund.costValue
        ),
      };
    } else {
      return fund;
    }
  });
  store.dispatch(updateAllFunds(updatedFunds));
};


export const isValidData = (data) => {
  const requiredKeys = ["schemeName", "units", "costValue", "isin"];
  data.forEach((fund) => {
    requiredKeys.forEach((key) => {
      if (!fund[key]) return false;
    });
  });
  return true;
}

export const formatFundData = async (data) => {
  // 1. Use Promise.all to wait for all inner async maps to finish
  const formattedData = await Promise.all(
    data.map(async (fund) => {
      
      let schemeCode = fund.code;
      let fetchedDetails = null;

      // 2. Only hit the DB if we are MISSING the code but HAVE the ISIN
      if (!schemeCode && fund.isin) {
        try {
          fetchedDetails = await getFundByISIN(fund.isin);
          if (fetchedDetails) {
            schemeCode = fetchedDetails.id; // Or fetchedDetails.code
          }
        } catch (err) {
          console.error(`Failed to fetch code for ISIN ${fund.isin}`, err);
        }
      }

      // 3. Return the clean object
      return {
        ...fund,
        // Use a better unique key strategy (Timestamp + Random) to avoid collision in loops
        key: fund.key ?? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        code: schemeCode,
        // Optional: fill in name if missing and we just fetched it
        name: fund.name ?? fetchedDetails?.name ?? "Unknown Fund"
      };
    })
  );

  return formattedData;
};

export const computeFundsSummary = (funds) => {
  return funds.reduce(
    (summary, fund) => {
      summary.totalCostValue += parseFloat(fund.costValue);
      summary.totalCurrentMktValue += fund.currentMktValue;
      summary.totalGainLoss += fund.gainLoss;
      summary.totalGainLossPercentage = calculateProfitLossPercentage(
        summary.totalGainLoss,
        summary.totalCostValue
      );
      return summary;
    },
    {
      totalUnits: 0,
      totalCostValue: 0,
      totalCurrentMktValue: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0
    }
  );
};