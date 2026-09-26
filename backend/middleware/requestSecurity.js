const unsafeKey = (key) =>
  key.startsWith("$") ||
  key.includes(".") ||
  ["__proto__", "constructor", "prototype"].includes(key);

const findUnsafeKey = (value, path = "") => {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const unsafePath = findUnsafeKey(value[index], `${path}[${index}]`);
      if (unsafePath) return unsafePath;
    }

    return null;
  }

  if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      const keyPath = path ? `${path}.${key}` : key;

      if (unsafeKey(key)) return keyPath;

      const unsafePath = findUnsafeKey(nestedValue, keyPath);
      if (unsafePath) return unsafePath;
    }
  }

  return null;
};

const rejectUnsafeInput = (req, res, next) => {
  const unsafePath = [req.params, req.query, req.body]
    .map((value) => findUnsafeKey(value))
    .find(Boolean);

  if (unsafePath) {
    return res.status(400).json({
      success: false,
      message: "Request contains an invalid field name.",
    });
  }

  if (Object.values(req.query).some((value) => typeof value !== "string")) {
    return res.status(400).json({
      success: false,
      message: "Query parameters must be plain text values.",
    });
  }

  return next();
};

const requireJsonObject = (req, res, next) => {
  if (!req.is("application/json")) {
    return res.status(415).json({
      success: false,
      message: "Content-Type must be application/json.",
    });
  }

  if (!req.body || Array.isArray(req.body) || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Request body must be a JSON object.",
    });
  }

  return next();
};

const allowBodyFields = (allowedFields, fieldTypes = {}) => (req, res, next) => {
  const unsupportedFields = Object.keys(req.body || {}).filter(
    (field) => !allowedFields.includes(field),
  );
  const invalidFields = Object.entries(fieldTypes)
    .filter(([field, types]) => {
      if (req.body[field] === undefined) return false;
      const valueType = req.body[field] === null
        ? "null"
        : Array.isArray(req.body[field])
          ? "array"
          : typeof req.body[field];
      return !types.includes(valueType);
    })
    .map(([field]) => field);

  if (unsupportedFields.length > 0 || invalidFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Request contains unsupported fields or invalid field types.",
      errors: { unsupportedFields, invalidFields },
    });
  }

  return next();
};

const allowQueryFields = (allowedFields) => (req, res, next) => {
  const unsupportedFields = Object.keys(req.query || {}).filter(
    (field) => !allowedFields.includes(field),
  );
  const invalidFields = Object.entries(req.query || {})
    .filter(([, value]) => typeof value !== "string")
    .map(([field]) => field);

  if (unsupportedFields.length > 0 || invalidFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Request contains unsupported query fields or invalid values.",
      errors: { unsupportedFields, invalidFields },
    });
  }

  return next();
};

module.exports = {
  rejectUnsafeInput,
  requireJsonObject,
  allowBodyFields,
  allowQueryFields,
};
