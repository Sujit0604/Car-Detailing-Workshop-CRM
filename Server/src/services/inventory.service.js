const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const { resolveScopedWorkshopId } = require("../utils/workshopScope.js");
const InventoryPart = require("../models/InventoryPart.js");
const Workshop = require("../models/Workshop.js");

const ensureWorkshopExists = async (workshopId) => {
  const workshop = await Workshop.findById(workshopId);

  if (!workshop) {
    throw new ApiError(404, "Workshop not found");
  }
};

const createInventoryPartService = async (data) => {
  const { workshopId, partNumber } = data;

  await ensureWorkshopExists(workshopId);

  const existing = await InventoryPart.findOne({ workshopId, partNumber });

  if (existing) {
    throw new ApiError(409, "A part with this part number already exists in the workshop");
  }

  const part = await InventoryPart.create(data);

  logger.info(`Inventory part created: ${part.partNumber}`);

  return part;
};

const getInventoryPartService = async (partId) => {
  const part = await InventoryPart.findById(partId);

  if (!part) {
    throw new ApiError(404, "Inventory part not found");
  }

  return part;
};

const listInventoryPartsService = async (query, user) => {
  const {
    workshopId: requestedWorkshopId,
    page = 1,
    limit = 10,
    status,
    lowStock,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  const workshopId = await resolveScopedWorkshopId(user, requestedWorkshopId);

  if (workshopId) filter.workshopId = workshopId;
  if (status) filter.status = status;

  if (lowStock === "true") {
    filter.$expr = { $lte: ["$stock.quantity", "$stock.reorderLevel"] };
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { partNumber: regex },
      { name: regex },
      { brand: regex },
      { category: regex },
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [parts, total] = await Promise.all([
    InventoryPart.find(filter)
      .populate("workshopId", "name code")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    InventoryPart.countDocuments(filter),
  ]);

  return {
    parts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateInventoryPartService = async (partId, updateData) => {
  const part = await getInventoryPartService(partId);

  if (updateData.partNumber && updateData.partNumber !== part.partNumber) {
    const existing = await InventoryPart.findOne({
      workshopId: part.workshopId,
      partNumber: updateData.partNumber,
    });

    if (existing) {
      throw new ApiError(409, "A part with this part number already exists in the workshop");
    }
  }

  Object.assign(part, updateData);

  await part.save();

  logger.info(`Inventory part updated: ${part.partNumber}`);

  return part;
};

const adjustStockService = async (partId, { adjustment, reason }) => {
  const part = await getInventoryPartService(partId);

  const nextQuantity = part.stock.quantity + adjustment;

  if (nextQuantity < 0) {
    throw new ApiError(
      400,
      `Insufficient stock. Current quantity is ${part.stock.quantity}, cannot adjust by ${adjustment}`,
    );
  }

  part.stock.quantity = nextQuantity;
  part.stock.reasonOfLastAdjustment = reason?.trim() || null;

  await part.save();

  logger.info(`Inventory stock adjusted for ${part.partNumber}: ${adjustment} -> ${nextQuantity}`);

  return part;
};

const deleteInventoryPartService = async (partId) => {
  const part = await getInventoryPartService(partId);

  part.status = "INACTIVE";

  await part.save();

  logger.info(`Inventory part deactivated (soft): ${part.partNumber}`);

  return { _id: part._id, status: part.status };
};

module.exports = {
  createInventoryPartService,
  getInventoryPartService,
  listInventoryPartsService,
  updateInventoryPartService,
  adjustStockService,
  deleteInventoryPartService,
};