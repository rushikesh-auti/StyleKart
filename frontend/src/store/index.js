import { configureStore } from "@reduxjs/toolkit";

import bagSlice from "./bagSlice";
import itemsSlice from "./itemsSlice";
import fetchStatusSlice from "./fetchStatusSlice";
import wishlistReducer from "./wishlistSlice";

const styleKartStore = configureStore({
  reducer: {
    bag: bagSlice.reducer,
    items: itemsSlice.reducer,
    fetchStatus: fetchStatusSlice.reducer,
    wishlist: wishlistReducer,
  },
});

export default styleKartStore;