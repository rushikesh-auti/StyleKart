import { createSlice } from "@reduxjs/toolkit";

const storedAdmin = localStorage.getItem("admin");
const storedToken = localStorage.getItem("adminToken");

const initialState = {
  admin: storedAdmin ? JSON.parse(storedAdmin) : null,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
};

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    setAdminSession: (state, action) => {
      const { token, admin } = action.payload;
      state.token = token;
      state.admin = admin;
      state.isAuthenticated = true;
      localStorage.setItem("adminToken", token);
      localStorage.setItem("admin", JSON.stringify(admin));
    },
    clearAdminSession: (state) => {
      state.token = null;
      state.admin = null;
      state.isAuthenticated = false;
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
    },
  },
});

export const { setAdminSession, clearAdminSession } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
