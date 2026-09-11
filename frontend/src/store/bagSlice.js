import { createSlice } from "@reduxjs/toolkit";

const readStoredBag = () => {
  try {
    const storedBag = JSON.parse(localStorage.getItem("stylekartBag") || "[]");
    return Array.isArray(storedBag) ? [...new Set(storedBag)] : [];
  } catch {
    return [];
  }
};

const persistBag = (bag) => {
  localStorage.setItem("stylekartBag", JSON.stringify(bag));
};

const bagSlice = createSlice({
  name: "bag",
  initialState: readStoredBag(),
  reducers: {
    addToBag: (state, action) => {
      if (!state.includes(action.payload)) {
        state.push(action.payload);
        persistBag(state);
      }
    },
    removeFromBag: (state, action) => {
      const nextBag = state.filter((itemId) => itemId !== action.payload);
      persistBag(nextBag);
      return nextBag;
    },
    clearBag: () => {
      persistBag([]);
      return [];
    },
  },
});

export const bagActions = bagSlice.actions;

export default bagSlice.reducer;