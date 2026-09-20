import { adminApiUrl } from "./adminApi";

export const getProducts = async (parameters = {}) => {
  const searchParameters = new URLSearchParams();

  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParameters.set(key, value);
    }
  });

  const queryString = searchParameters.toString();
  const endpoint = queryString
    ? `/products?${queryString}`
    : "/products";

  const response = await fetch(adminApiUrl(endpoint));
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to load products. Please try again.",
    );
  }

  return data;
};