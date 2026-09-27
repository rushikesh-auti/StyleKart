import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { userFetch } from "../utils/userApi";

// Remove the old browser-wide cart. Cart data now belongs to the authenticated user in MongoDB.
localStorage.removeItem("stylekartBag");

const normalizeItem = (item = {}) => ({
  productId: item.productId,
  quantity: Math.max(Number(item.quantity) || 1, 1),
  selectedSize: item.selectedSize || "",
  selectedColor: item.selectedColor || "",
});

export const loadUserCart = createAsyncThunk("bag/loadUserCart", async () => {
  const data = await userFetch("/cart");
  return data.items || [];
});

export const addToBag = createAsyncThunk("bag/addToBag", async (payload) => {
  const data = await userFetch("/cart/items", {
    method: "POST",
    body: JSON.stringify(normalizeItem(payload)),
  });
  return data.items || [];
});

export const updateBagQuantity = createAsyncThunk(
  "bag/updateBagQuantity",
  async (payload) => {
    const data = await userFetch("/cart/items", {
      method: "PATCH",
      body: JSON.stringify({
        productId: payload.productId,
        quantity: Math.max(Number(payload.quantity) || 1, 1),
        selectedSize: payload.selectedSize || "",
        selectedColor: payload.selectedColor || "",
      }),
    });
    return data.items || [];
  },
);

export const removeFromBag = createAsyncThunk(
  "bag/removeFromBag",
  async (payload) => {
    const data = await userFetch("/cart/items", {
      method: "DELETE",
      body: JSON.stringify({
        productId: payload.productId,
        selectedSize: payload.selectedSize || "",
        selectedColor: payload.selectedColor || "",
      }),
    });
    return data.items || [];
  },
);

export const clearUserCart = createAsyncThunk("bag/clearUserCart", async () => {
  const data = await userFetch("/cart", { method: "DELETE" });
  return data.items || [];
});

const bagSlice = createSlice({
  name: "bag",
  initialState: [],
  reducers: {
    resetBag: () => [],
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserCart.fulfilled, (_state, action) => action.payload)
      .addCase(addToBag.fulfilled, (_state, action) => action.payload)
      .addCase(updateBagQuantity.fulfilled, (_state, action) => action.payload)
      .addCase(removeFromBag.fulfilled, (_state, action) => action.payload)
      .addCase(clearUserCart.fulfilled, (_state, action) => action.payload);
  },
});

export const bagActions = {
  ...bagSlice.actions,
  loadUserCart,
  addToBag,
  updateQuantity: updateBagQuantity,
  removeFromBag,
  clearBag: clearUserCart,
};

export default bagSlice.reducer;
