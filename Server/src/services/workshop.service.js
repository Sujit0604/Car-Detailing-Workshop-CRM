const ApiError = require("../utils/ApiError.js");
const Workshop = require("../models/Workshop.js");
const logger = require("../utils/logger.js");

const createWorkshopService = async (workshopData) => {
  const { code } = workshopData;

  const existingWorkshop = await Workshop.findOne({ code });

  if (existingWorkshop) {
    throw new ApiError(409, "A workshop with this code already exists");
  }

  const workshop = await Workshop.create(workshopData);

  logger.info(`Workshop created: ${workshop._id}`);

  return workshop;
};

const getWorkshopByIdService = async (workshopId) => {
  const workshop = await Workshop.findById(workshopId);

  if (!workshop) {
    throw new ApiError(404, "Workshop not found");
  }

  return workshop;
};

const listWorkshopsService = async (user, query) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    city,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  } else if (user.role !== "ADMIN") {
    filter.status = "ACTIVE";
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { code: regex }, { "address.city": regex }];
  }

  if (city) {
    filter["address.city"] = new RegExp(city, "i");
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [workshops, total] = await Promise.all([
    Workshop.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Workshop.countDocuments(filter),
  ]);

  return {
    workshops,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateWorkshopService = async (workshopId, updateData) => {
  const workshop = await getWorkshopByIdService(workshopId);

  if (updateData.code && updateData.code !== workshop.code) {
    const existingWorkshop = await Workshop.findOne({ code: updateData.code });

    if (existingWorkshop) {
      throw new ApiError(409, "A workshop with this code already exists");
    }
  }

  Object.assign(workshop, updateData);

  await workshop.save();

  logger.info(`Workshop updated: ${workshop._id}`);

  return workshop;
};

const deleteWorkshopService = async (workshopId) => {
  const workshop = await getWorkshopByIdService(workshopId);

  workshop.status = "INACTIVE";

  await workshop.save();

  logger.info(`Workshop deactivated (soft): ${workshop._id}`);

  return { _id: workshop._id, status: workshop.status };
};

module.exports = {
  createWorkshopService,
  getWorkshopByIdService,
  listWorkshopsService,
  updateWorkshopService,
  deleteWorkshopService,
};