import { configureStore } from "@reduxjs/toolkit";

import bagReducer from "./bagSlice";
import itemsReducer from "./itemsSlice";
import fetchStatusReducer from "./fetchStatusSlice";
import wishlistReducer from "./wishlistSlice";
import searchReducer from "./searchSlice";
import userAuthReducer from "./userAuthSlice";
import adminAuthReducer from "./adminAuthSlice";

const myntraStore = configureStore({
  reducer: {
    bag: bagReducer,
    items: itemsReducer,
    fetchStatus: fetchStatusReducer,
    wishlist: wishlistReducer,
    search: searchReducer,

    userAuth: userAuthReducer,
    adminAuth: adminAuthReducer,
  },
});

export default myntraStore;