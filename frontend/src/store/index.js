import { configureStore } from "@reduxjs/toolkit";

import bagSlice from "./bagSlice";
import itemsSlice from "./itemsSlice";
import fetchStatusSlice from "./fetchStatusSlice";
import wishlistReducer from "./wishlistSlice";
import searchReducer from "./searchSlice";
import adminAuthReducer from "./adminAuthSlice";
import userAuthReducer from "./userAuthSlice";

const myntraStore = configureStore({
  reducer: {
    bag: bagSlice.reducer,
    items: itemsSlice.reducer,
    fetchStatus:
      fetchStatusSlice.reducer,
    wishlist: wishlistReducer,
    search: searchReducer,
    adminAuth: adminAuthReducer,
    userAuth: userAuthReducer,
  },
});

export default myntraStore;