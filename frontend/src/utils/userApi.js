const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getUserToken = () => localStorage.getItem("userToken");

export const clearUserSession = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("user");
};

export const userFetch = async (path, options = {}) => {
  const token = getUserToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const requestUrl = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE_URL}${path}`;

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearUserSession();
    window.location.assign("/login");
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to complete the request. Please try again.",
    );
  }

  return data;
};
