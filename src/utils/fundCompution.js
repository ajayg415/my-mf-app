import { store } from "../store/store";
import { getFundsByName } from "./api.js";
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
  const requiredKeys = ["schemeName", "units", "costValue"];
  data.forEach((fund) => {
    requiredKeys.forEach((key) => {
      if (!fund[key]) return false;
    });
  });
  return true;
}

export const formatFundData = (data) => {
  return data.map(fund => ({
    key: fund.key ?? new Date().getTime(),
    code: fund.code ?? getFundsByName(fund.schemeName).then(results => results.length > 0 ? results[0].id : null),
    ...fund,
  }));
}