import { createSlice } from "@reduxjs/toolkit";
import { saveUserData } from "../../utils/storage.js";

const initialState = {
  userData: {
    name: "MF User",
    funds: [],
  },
  data: "",
  loading: false,
  error: null,
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

      // Sort the funds array based on the field
      state.userData.funds.sort((a, b) => {
        const aVal = isNaN(a[fieldKey]) ? a[fieldKey] : parseFloat(a[fieldKey]);
        const bVal = isNaN(b[fieldKey]) ? b[fieldKey] : parseFloat(b[fieldKey]);

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
