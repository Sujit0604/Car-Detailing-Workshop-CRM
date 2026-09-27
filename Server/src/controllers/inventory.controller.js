const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  createInventoryPartService,
  getInventoryPartService,
  listInventoryPartsService,
  updateInventoryPartService,
  adjustStockService,
  deleteInventoryPartService,
} = require("../services/inventory.service.js");

const createInventoryPart = asyncHandler(async (req, res) => {
  const part = await createInventoryPartService(req.body);

  return sendResponse(res, 201, "Inventory part created successfully", part);
});

const getInventoryPart = asyncHandler(async (req, res) => {
  const part = await getInventoryPartService(req.params.id);

  return sendResponse(res, 200, "Inventory part fetched successfully", part);
});

const listInventoryParts = asyncHandler(async (req, res) => {
  const result = await listInventoryPartsService(req.query, req.user);

  return sendResponse(res, 200, "Inventory parts fetched successfully", result);
});

const updateInventoryPart = asyncHandler(async (req, res) => {
  const part = await updateInventoryPartService(req.params.id, req.body);

  return sendResponse(res, 200, "Inventory part updated successfully", part);
});

const adjustStock = asyncHandler(async (req, res) => {
  const part = await adjustStockService(req.params.id, req.body);

  return sendResponse(res, 200, "Stock adjusted successfully", part);
});

const deleteInventoryPart = asyncHandler(async (req, res) => {
  const result = await deleteInventoryPartService(req.params.id);

  return sendResponse(res, 200, "Inventory part removed successfully", result);
});

module.exports = {
  createInventoryPart,
  getInventoryPart,
  listInventoryParts,
  updateInventoryPart,
  adjustStock,
  deleteInventoryPart,
};