const getProductImageUrl = (image) => {
  if (typeof image !== "string" || !image.trim()) {
    return "";
  }

  const imagePath = image.trim();

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return `/${imagePath.replace(/^\/+/, "")}`;
};

export default getProductImageUrl;
