const LOCAL_ORIGIN = "https://stylekart.invalid";

export const getSafeCustomerRedirect = (destination) => {
  const candidate =
    typeof destination === "string"
      ? destination
      : destination &&
          typeof destination.pathname === "string" &&
          destination.pathname.startsWith("/")
        ? `${destination.pathname}${destination.search || ""}${destination.hash || ""}`
        : "";

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return "/";
  }

  try {
    const url = new URL(candidate, LOCAL_ORIGIN);
    if (
      url.origin !== LOCAL_ORIGIN ||
      url.pathname === "/admin" ||
      url.pathname.startsWith("/admin/") ||
      url.pathname === "/login"
    ) {
      return "/";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
};

export const getCurrentRoute = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

export const getLoginUrl = (destination) => {
  const safeDestination = getSafeCustomerRedirect(destination);
  return safeDestination === "/"
    ? "/login"
    : `/login?redirect=${encodeURIComponent(safeDestination)}`;
};
