const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  generateInvoice,
  listInvoices,
  listMyInvoices,
  getInvoiceById,
  issueInvoice,
  voidInvoice,
} = require("../controllers/invoice.controller.js");
const {
  generateInvoiceSchema,
  invoiceIdParamSchema,
  listInvoicesQuerySchema,
  issueInvoiceSchema,
  voidInvoiceSchema,
} = require("../validators/invoice.validator.js");

const invoiceRouter = express.Router();

invoiceRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Invoice Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

invoiceRouter.post(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(generateInvoiceSchema),
  logRoute("Generate"),
  generateInvoice,
);

invoiceRouter.get(
  "/mine",
  validate(listInvoicesQuerySchema),
  logRoute("ListMine"),
  listMyInvoices,
);

invoiceRouter.get(
  "/",
  validate(listInvoicesQuerySchema),
  logRoute("List"),
  listInvoices,
);

invoiceRouter.get(
  "/:id",
  validate(invoiceIdParamSchema),
  logRoute("GetById"),
  getInvoiceById,
);

invoiceRouter.patch(
  "/:id/issue",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(issueInvoiceSchema),
  logRoute("Issue"),
  issueInvoice,
);

invoiceRouter.patch(
  "/:id/void",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(voidInvoiceSchema),
  logRoute("Void"),
  voidInvoice,
);

module.exports = invoiceRouter;
