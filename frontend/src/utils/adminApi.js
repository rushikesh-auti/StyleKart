const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getAdminToken = () => localStorage.getItem("adminToken");

export const clearAdminSession = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
};

export const adminFetch = async (path, options = {}) => {
  const token = getAdminToken();
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

  if (response.status === 401) {
    clearAdminSession();
    window.location.assign("/admin/login");
  }

  return response;
};

export const adminApiUrl = (path) =>
  /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`;
