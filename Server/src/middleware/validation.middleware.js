const { z } = require("zod");
const ApiError = require("../utils/ApiError.js");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const formattedErrors = result.error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    return next(new ApiError(422, "Validation failed", formattedErrors));
  }

  // Replace req data with parsed (coerced/transformed) values.
  // Only override keys defined in the schema so chained validators
  // (params + query) do not wipe each other's values.
  if (result.data.body !== undefined) req.body = result.data.body;
  if (result.data.query !== undefined) req.query = result.data.query;
  if (result.data.params !== undefined) req.params = result.data.params;
  next();
};   

module.exports = validate;
