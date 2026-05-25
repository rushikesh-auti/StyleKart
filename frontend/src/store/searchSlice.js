import { createSlice } from "@reduxjs/toolkit";

const searchSlice = createSlice({
  name: "search",
  initialState: "",
  reducers: {
    setSearchText: (state, action) => {
      return action.payload;
    },
  },
});

export const searchActions =
  searchSlice.actions;

export default searchSlice.reducer;