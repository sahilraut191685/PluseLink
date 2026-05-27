// src/middleware/validate.js — Generic Zod validation middleware
/**
 * Creates an Express middleware that validates req.body against a Zod schema
 * @param {import('zod').ZodSchema} schema
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; // Replace with parsed (cleaned + coerced) data
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        timestamp: new Date().toISOString(),
      });
    }
  };
}

module.exports = validate;
