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
    }
  },
});

export const { setData, setUserData, addOrUpdateFund, setUserName, updateAllFunds, wipeUserData } =
  mfSlice.actions;

export default mfSlice.reducer;
