const AppError = require("../utils/AppError");

// Ensures the request body is a JSON object and has no unknown fields
// for the fields we accept. Keeps controllers clean.
const ALLOWED_FIELDS = [
  "name",
  "sku",
  "category",
  "price",
  "quantity",
  "reorderLevel",
  "supplier",
];

const validateBody = (req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a JSON object", 400));
  }
  const unknown = Object.keys(req.body).filter(
    (key) => !ALLOWED_FIELDS.includes(key),
  );
  if (unknown.length > 0) {
    return next(new AppError(`Unknown field(s): ${unknown.join(", ")}`, 400));
  }
  next();
};

const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return next(new AppError(`Invalid product ID: ${id}`, 400));
  }
  next();
};

module.exports = { validateBody, validateObjectId };
