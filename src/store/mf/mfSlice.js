import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mfsList: null,
  data: "",
  loading: false,
  error: null,
};

const mfSlice = createSlice({
  name: "mf",
  initialState,
  reducers: {
    setMfsList(state, action) {
      state.mfsList = action.payload;
    },
    setData(state, action) {
      state.data = action.payload;
    }
  }
});

export const { setMfsList, setData } = mfSlice.actions;

export default mfSlice.reducer;