import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { userFetch } from "../utils/userApi";

export const loadUserWishlist = createAsyncThunk(
  "wishlist/loadUserWishlist",
  async () => {
    const data = await userFetch("/wishlist");
    return data.productIds || [];
  },
);

export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async (productId) => {
    const data = await userFetch("/wishlist/items", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
    return data.productIds || [];
  },
);

export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (productId) => {
    const data = await userFetch("/wishlist/items", {
      method: "DELETE",
      body: JSON.stringify({ productId }),
    });
    return data.productIds || [];
  },
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: [],

  reducers: {
    resetWishlist: () => [],
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserWishlist.fulfilled, (_state, action) => action.payload)
      .addCase(addToWishlist.fulfilled, (_state, action) => action.payload)
      .addCase(removeFromWishlist.fulfilled, (_state, action) => action.payload);
  },
});

export const wishlistActions = {
  ...wishlistSlice.actions,
  loadUserWishlist,
  addToWishlist,
  removeFromWishlist,
};

export default wishlistSlice.reducer;
