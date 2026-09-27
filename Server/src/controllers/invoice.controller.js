const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  generateInvoiceService,
  listInvoicesService,
  listMyInvoicesService,
  getInvoiceByIdService,
  issueInvoiceService,
  voidInvoiceService,
} = require("../services/invoice.service.js");

const generateInvoice = asyncHandler(async (req, res) => {
  const invoice = await generateInvoiceService(req.body, req.user);
  return sendResponse(res, 201, "Invoice generated successfully", invoice);
});

const listInvoices = asyncHandler(async (req, res) => {
  const result = await listInvoicesService(req.user, req.query);
  return sendResponse(res, 200, "Invoices fetched successfully", result);
});

const listMyInvoices = asyncHandler(async (req, res) => {
  const result = await listMyInvoicesService(req.user, req.query);
  return sendResponse(res, 200, "Invoices fetched successfully", result);
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceByIdService(req.params.id, req.user);
  return sendResponse(res, 200, "Invoice fetched successfully", invoice);
});

const issueInvoice = asyncHandler(async (req, res) => {
  const invoice = await issueInvoiceService(req.params.id, req.body, req.user);
  return sendResponse(res, 200, "Invoice issued successfully", invoice);
});

const voidInvoice = asyncHandler(async (req, res) => {
  const invoice = await voidInvoiceService(req.params.id, req.body, req.user);
  return sendResponse(res, 200, "Invoice voided successfully", invoice);
});

module.exports = {
  generateInvoice,
  listInvoices,
  listMyInvoices,
  getInvoiceById,
  issueInvoice,
  voidInvoice,
};
