const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
import { getLoginUrl } from "./authRedirect";

export const clearAdminSession = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
};

export const adminFetch = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const requestUrl = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE_URL}${path}`;

  const response = await fetch(requestUrl, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    clearAdminSession();
    window.location.assign(getLoginUrl("/admin"));
  }

  return response;
};

export const getAdminErrorMessage = (data, fallback) => {
  const fieldErrors = data?.errors
    ? Object.values(data.errors).flatMap((value) =>
        Array.isArray(value) ? value : [value],
      )
    : [];
  const details = fieldErrors.filter((value) => typeof value === "string");
  const message =
    typeof data?.message === "string" && data.message.trim()
      ? data.message
      : fallback;

  if (details.length === 0) return message;
  if (message === "Product validation failed") return details.join(". ");
  return `${message} ${details.join(". ")}`;
};

export const adminApiUrl = (path) =>
  /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`;
