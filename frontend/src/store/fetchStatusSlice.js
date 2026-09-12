import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  fetchDone: false,
  currentlyFetching: false,
  error: null,
};

const fetchStatusSlice = createSlice({
  name: "fetchStatus",
  initialState,
  reducers: {
    markFetchDone: (state) => {
      state.fetchDone = true;
    },

    markFetchingStarted: (state) => {
      state.currentlyFetching = true;
      state.error = null;
    },

    markFetchingFinished: (state) => {
      state.currentlyFetching = false;
    },

    markFetchFailed: (state, action) => {
      state.error = action.payload;
      state.fetchDone = false;
    },

    resetFetchStatus: () => initialState,
  },
});

export const fetchStatusActions = fetchStatusSlice.actions;

export default fetchStatusSlice.reducer;