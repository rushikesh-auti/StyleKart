import { createSlice } from "@reduxjs/toolkit";

const authSessionSlice = createSlice({
  name: "authSession",
  initialState: { status: "checking", revision: 0 },
  reducers: {
    setSessionStatus: (state, action) => {
      state.status = action.payload;
      if (action.payload !== "checking") state.revision += 1;
    },
  },
});

export const { setSessionStatus } = authSessionSlice.actions;
export default authSessionSlice.reducer;
