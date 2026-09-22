const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  createServiceCategoryService,
  getServiceCategoryByIdService,
  listServiceCategoriesService,
  updateServiceCategoryService,
  deleteServiceCategoryService,
} = require("../services/serviceCategory.service.js");

const createServiceCategory = asyncHandler(async (req, res) => {
  const category = await createServiceCategoryService(req.body);

  return sendResponse(res, 201, "Service category created successfully", category);
});

const getServiceCategoryById = asyncHandler(async (req, res) => {
  const category = await getServiceCategoryByIdService(req.params.id);

  return sendResponse(res, 200, "Service category fetched successfully", category);
});

const listServiceCategories = asyncHandler(async (req, res) => {
  const result = await listServiceCategoriesService(req.query);

  return sendResponse(res, 200, "Service categories fetched successfully", result);
});

const updateServiceCategory = asyncHandler(async (req, res) => {
  const category = await updateServiceCategoryService(req.params.id, req.body);

  return sendResponse(res, 200, "Service category updated successfully", category);
});

const deleteServiceCategory = asyncHandler(async (req, res) => {
  const result = await deleteServiceCategoryService(req.params.id);

  return sendResponse(res, 200, "Service category deleted successfully", result);
});

module.exports = {
  createServiceCategory,
  getServiceCategoryById,
  listServiceCategories,
  updateServiceCategory,
  deleteServiceCategory,
};