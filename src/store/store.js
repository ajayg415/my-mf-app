import { configureStore } from "@reduxjs/toolkit";

import mfReducer from "./mf/mfSlice";

export const store = configureStore({
  reducer: {
    mf: mfReducer,
  },
});