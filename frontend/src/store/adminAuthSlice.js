import { createSlice } from "@reduxjs/toolkit";

const storedAdmin = localStorage.getItem("admin");
localStorage.removeItem("adminToken");

const initialState = {
  admin: storedAdmin ? JSON.parse(storedAdmin) : null,
  isAuthenticated: Boolean(storedAdmin),
};

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    setAdminSession: (state, action) => {
      const { admin } = action.payload;
      state.admin = admin;
      state.isAuthenticated = true;
      localStorage.setItem("admin", JSON.stringify(admin));
    },
    clearAdminSession: (state) => {
      state.admin = null;
      state.isAuthenticated = false;
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
    },
  },
});

export const { setAdminSession, clearAdminSession } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
