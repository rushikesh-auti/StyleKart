import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
localStorage.removeItem("userToken");

const userAuthSlice = createSlice({
  name: "userAuth",
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    isAuthenticated: Boolean(storedUser),
  },
  reducers: {
    setUserSession: (state, action) => {
      const { user } = action.payload;
      state.user = user;
      state.isAuthenticated = true;

      localStorage.setItem("user", JSON.stringify(user));
    },

    updateUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    clearUserSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;

      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
    },

    restoreUserSession: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;

      localStorage.removeItem("userToken");
      localStorage.setItem(
        "user",
        JSON.stringify(action.payload.user),
      );
    },
  },
});

export const {
  setUserSession,
  updateUser,
  clearUserSession,
  restoreUserSession,
} = userAuthSlice.actions;

export default userAuthSlice.reducer;