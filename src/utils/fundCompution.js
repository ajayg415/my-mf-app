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

export const computeFundMetrics = ({ data, code }) => {
  const state = store.getState();
  const funds = state.mf?.userData?.funds || [];

  // Helper to safely get NAV at a specific index
  const getNav = (index) => (data[index] ? parseFloat(data[index].nav) : null);

  const todayNav = getNav(0) || 0;
  const prevNav = getNav(1); // 1 Day ago
  const weekNav = getNav(5); // 1 Week ago (~5 trading days)
  const monthNav = getNav(21); // 1 Month ago (~21 trading days)

  const updatedFunds = funds.map((fund) => {
    if (fund.code === code) {
      const currentVal = calculateFundValue(fund.units, todayNav);

      return {
        ...fund,
        nav: todayNav,
        currentMktValue: currentVal,

        // --- Total P&L (Overall) ---
        gainLoss: calculateProfitLoss(currentVal, fund.costValue),
        gainLossPercentage: calculateProfitLossPercentage(
          calculateProfitLoss(currentVal, fund.costValue),
          fund.costValue
        ),

        // --- 1 Day Change ---
        dayChange: prevNav
          ? calculateProfitLoss(
              currentVal,
              calculateFundValue(fund.units, prevNav)
            )
          : 0,
        dayChangePercentage: prevNav
          ? ((todayNav - prevNav) / prevNav) * 100
          : 0,

        // --- 1 Week Change ---
        weekChange: weekNav
          ? calculateProfitLoss(
              currentVal,
              calculateFundValue(fund.units, weekNav)
            )
          : 0,
        weekChangePercentage: weekNav
          ? ((todayNav - weekNav) / weekNav) * 100
          : 0,

        // --- 1 Month Change ---
        monthChange: monthNav
          ? calculateProfitLoss(
              currentVal,
              calculateFundValue(fund.units, monthNav)
            )
          : 0,
        monthChangePercentage: monthNav
          ? ((todayNav - monthNav) / monthNav) * 100
          : 0,
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
};

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
        key:
          fund.key ??
          `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        code: schemeCode,
        // Optional: fill in name if missing and we just fetched it
        name: fund.name ?? fetchedDetails?.name ?? "Unknown Fund",
        units: parseFloat(fund.units) || 0,
        costValue: parseFloat(fund.costValue) || 0,
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
      summary.totalDayChange += fund.dayChange || 0;
      summary.totalWeekChange += fund.weekChange || 0;
      summary.totalMonthChange += fund.monthChange || 0;
      summary.totalGainLossPercentage = calculateProfitLossPercentage(
        summary.totalGainLoss,
        summary.totalCostValue
      );
      return summary;
    },
    {
      totalCostValue: 0,
      totalCurrentMktValue: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      totalDayChange: 0,
      totalWeekChange: 0,
      totalMonthChange: 0,
    }
  );
};
