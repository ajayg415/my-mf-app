import { createSlice } from "@reduxjs/toolkit";
import { saveUserData } from "../../utils/storage.js";

const parseInvestmentDate = (fundData) => {
  const candidates = [
    fundData?.investedOn,
    fundData?.purchaseDate,
    fundData?.addedOn,
    fundData?.createdAt,
    fundData?.startDate,
    fundData?.investmentDate,
    fundData?.date,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date();
  fallback.setFullYear(fallback.getFullYear() - 1);
  return fallback;
};

const calculateXirrEstimate = ({ initialInvestment, finalValue, startDate, endDate = new Date() }) => {
  const investment = parseFloat(initialInvestment) || 0;
  const terminalValue = parseFloat(finalValue) || 0;

  if (investment <= 0 || terminalValue < 0) return null;
  if (terminalValue === 0) return -1.0;

  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
  const years = totalDays / 365.25;

  return Math.pow(terminalValue / investment, 1 / years) - 1;
};

const getDerivedCurrentValue = (fundData) => {
  const storedValue = parseFloat(fundData?.currentMktValue || 0);
  const unitsValue = parseFloat(fundData?.units || 0) * parseFloat(fundData?.nav || 0);
  const gainValue = parseFloat(fundData?.costValue || 0) * (1 + (parseFloat(fundData?.gainLossPercentage || 0) / 100));

  if (Number.isFinite(storedValue) && storedValue > 0) return storedValue;
  if (Number.isFinite(unitsValue) && unitsValue > 0) return unitsValue;
  if (Number.isFinite(gainValue) && gainValue > 0) return gainValue;
  return 0;
};

const initialState = {
  userData: {
    name: "MF User",
    funds: [],
  },
  data: "",
  loading: false,
  error: null,
  sortBy: null,
  toast: {
    show: false,
    message: "",
    toastClass: "",
  },
  activeData: {
    count: 0
  }
};

const mfSlice = createSlice({
  name: "mf",
  initialState,
  reducers: {
    setData(state, action) {
      state.data = action.payload;
    },
    setUserName(state, action) {
      // setUserData(state, { ...state.userData, name: action.payload });
      state.userData.name = action.payload;
      saveUserData(state.userData);
    },
    setUserData(state, action) {
      state.userData = action.payload;
      saveUserData(state.userData);
    },
    addFund(state, action) {
      if (state.userData.funds) {
        state.userData.funds.push(action.payload);
      } else {
        state.userData.funds = [action.payload];
      }
    },
    updateFund(state, action) {
      const { key, ...updatedFund } = action.payload;
      const index = state.userData.funds.findIndex((fund) => fund.key === key);
      if (index !== -1) {
        state.userData.funds[index] = {
          ...state.userData.funds[index],
          ...updatedFund,
        };
      }
    },
    addOrUpdateFund(state, action) {
      const fund = action.payload;

      const index = state.userData.funds.findIndex((f) => f.key === fund.key);
      if (index !== -1) {
        state.userData.funds[index] = {
          ...state.userData.funds[index],
          ...fund,
        };
      } else {
        state.userData.funds.push(fund);
      }
      saveUserData(state.userData);
    },
    updateAllFunds(state, action) {
      state.userData.funds = action.payload;
      saveUserData(state.userData);
    },
    wipeUserData(state) {
      state.userData = initialState.userData;
      saveUserData(state.userData);
    },
    sortFunds(state, action) {
      const { fieldKey } = action.payload;
      if (!fieldKey || !state.userData.funds) return;

      // Track the active sort field so cards can render the sorted value
      state.sortBy = fieldKey;

      // Sort the funds array based on the field
      state.userData.funds.sort((a, b) => {
        let aVal = a[fieldKey];
        let bVal = b[fieldKey];

        if (fieldKey === "xirr") {
          const aXirr = calculateXirrEstimate({
            initialInvestment: a.costValue,
            finalValue: getDerivedCurrentValue(a),
            startDate: parseInvestmentDate(a),
            endDate: new Date(),
          });
          const bXirr = calculateXirrEstimate({
            initialInvestment: b.costValue,
            finalValue: getDerivedCurrentValue(b),
            startDate: parseInvestmentDate(b),
            endDate: new Date(),
          });

          aVal = aXirr == null ? null : aXirr;
          bVal = bXirr == null ? null : bXirr;
        } else {
          aVal = isNaN(a[fieldKey]) ? a[fieldKey] : parseFloat(a[fieldKey]);
          bVal = isNaN(b[fieldKey]) ? b[fieldKey] : parseFloat(b[fieldKey]);
        }

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Numeric comparison
        if (typeof aVal === "number" && typeof bVal === "number") {
          return bVal - aVal; // Descending order for numbers
        }

        // String comparison
        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal); // Ascending order for strings
        }

        return 0;
      });
      saveUserData(state.userData);
    },
    showToast(state, action) {
      const { message, type } = action.payload;
      const toastClass = type === "success" ? "alert-success" : "alert-error";
      state.toast = { show: true, message, toastClass };
    },
    hideToast(state) {
      state.toast = { show: false, message: "", toastClass: "" };
    },
    setActiveDataCount(state, action) {
      state.activeData.count = action.payload;
    }
  },
});

export const {
  setData,
  setUserData,
  addOrUpdateFund,
  setUserName,
  updateAllFunds,
  wipeUserData,
  sortFunds,
  showToast,
  hideToast,
  setActiveDataCount
} = mfSlice.actions;

export default mfSlice.reducer;
