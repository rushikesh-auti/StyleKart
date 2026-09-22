const STORAGE_KEY = "stylekartRecentlyViewed";
const MAX_RECENT_PRODUCTS = 8;

const readRecentlyViewed = () => {
  try {
    const products = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    );

    return Array.isArray(products) ? products : [];
  } catch {
    return [];
  }
};

export const addRecentlyViewedProduct = (product) => {
  const recentProducts = readRecentlyViewed();

  const nextProducts = [
    product,
    ...recentProducts.filter(
      (recentProduct) => recentProduct.id !== product.id,
    ),
  ].slice(0, MAX_RECENT_PRODUCTS);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(nextProducts),
  );
};

export const getRecentlyViewedProducts = (currentProductId) =>
  readRecentlyViewed().filter(
    (product) => product.id !== currentProductId,
  );