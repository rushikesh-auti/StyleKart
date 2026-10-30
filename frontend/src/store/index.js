import { configureStore } from "@reduxjs/toolkit";

import itemsReducer from "./itemsSlice";
import bagReducer from "./bagSlice";
import wishlistReducer from "./wishlistSlice";
import searchReducer from "./searchSlice";
import fetchStatusReducer from "./fetchStatusSlice";
import userAuthReducer from "./userAuthSlice";
import adminAuthReducer from "./adminAuthSlice";
import authSessionReducer from "./authSessionSlice";

const styleKartStore = configureStore({
  reducer: {
    items: itemsReducer,
    bag: bagReducer,
    wishlist: wishlistReducer,
    search: searchReducer,
    fetchStatus: fetchStatusReducer,
    userAuth: userAuthReducer,
    adminAuth: adminAuthReducer,
    authSession: authSessionReducer,
  },
});

export default styleKartStore;