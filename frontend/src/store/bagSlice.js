import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "stylekartBag";

const createCartKey = ({
  productId,
  selectedSize = "",
  selectedColor = "",
}) => `${productId}::${selectedSize}::${selectedColor}`;

const readStoredBag = () => {
  try {
    const storedBag = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    );

    if (!Array.isArray(storedBag)) {
      return [];
    }

    return storedBag.map((item) => {
      if (typeof item === "string") {
        return {
          key: createCartKey({ productId: item }),
          productId: item,
          quantity: 1,
          selectedSize: "",
          selectedColor: "",
        };
      }

      return {
        key:
          item.key ||
          createCartKey({
            productId: item.productId,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          }),
        productId: item.productId,
        quantity: Math.max(Number(item.quantity) || 1, 1),
        selectedSize: item.selectedSize || "",
        selectedColor: item.selectedColor || "",
      };
    });
  } catch {
    return [];
  }
};

const persistBag = (bag) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
};

const normalizeCartItem = (payload) => {
  if (typeof payload === "string") {
    return {
      productId: payload,
      quantity: 1,
      selectedSize: "",
      selectedColor: "",
    };
  }

  return {
    productId: payload.productId,
    quantity: Math.max(Number(payload.quantity) || 1, 1),
    selectedSize: payload.selectedSize || "",
    selectedColor: payload.selectedColor || "",
  };
};

const bagSlice = createSlice({
  name: "bag",
  initialState: readStoredBag(),
  reducers: {
    addToBag: (state, action) => {
      const item = normalizeCartItem(action.payload);

      if (!item.productId) {
        return;
      }

      const key = createCartKey(item);
      const existingItem = state.find(
        (cartItem) => cartItem.key === key,
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        state.push({
          key,
          ...item,
        });
      }

      persistBag(state);
    },

    updateQuantity: (state, action) => {
      const { key, quantity } = action.payload;
      const cartItem = state.find((item) => item.key === key);

      if (!cartItem) {
        return;
      }

      cartItem.quantity = Math.max(Number(quantity) || 1, 1);
      persistBag(state);
    },

    removeFromBag: (state, action) => {
      const nextBag = state.filter(
        (item) => item.key !== action.payload,
      );

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