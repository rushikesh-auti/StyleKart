import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("userToken");

const userAuthSlice = createSlice({
  name: "userAuth",
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isAuthenticated: Boolean(storedToken),
  },
  reducers: {
    setUserSession: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      localStorage.setItem("userToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    clearUserSession: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
    },
    restoreUserSession: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
  },
});

export const {
  setUserSession,
  clearUserSession,
  restoreUserSession,
} = userAuthSlice.actions;
export default userAuthSlice.reducer;
