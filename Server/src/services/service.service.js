const ApiError = require("../utils/ApiError.js");
const Service = require("../models/Service.js");
const ServiceCategory = require("../models/ServiceCategory.js");
const Workshop = require("../models/Workshop.js");
const logger = require("../utils/logger.js");

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const validateWorkshopAndCategory = async (workshopId, categoryId) => {
  if (categoryId) {
    const category = await ServiceCategory.findById(categoryId);

    if (!category) {
      throw new ApiError(400, "Service category not found");
    }
  }

  if (workshopId) {
    const workshop = await Workshop.findOne({ _id: workshopId, status: "ACTIVE" });

    if (!workshop) {
      throw new ApiError(404, "Workshop not found or not active");
    }
  }
};

const ensureUniqueSlug = async (slug, workshopId, excludeServiceId) => {
  const filter = { workshopId, slug };

  if (excludeServiceId) {
    filter._id = { $ne: excludeServiceId };
  }

  const existingService = await Service.findOne(filter);

  if (existingService) {
    throw new ApiError(409, "A service with this slug already exists at this workshop");
  }
};

const createServiceService = async (serviceData) => {
  const { workshopId, categoryId, name, slug } = serviceData;

  await validateWorkshopAndCategory(workshopId, categoryId);

  const resolvedSlug = slug && slug.trim() !== "" ? slug : slugify(name);

  await ensureUniqueSlug(resolvedSlug, workshopId);

  const service = await Service.create({
    ...serviceData,
    slug: resolvedSlug,
  });

  logger.info(`Service created: ${service._id}`);

  return service;
};

const getServiceByIdService = async (serviceId) => {
  const service = await Service.findById(serviceId).populate("categoryId", "name slug");

  if (!service) {
    throw new ApiError(404, "Service not found");
  }

  return service;
};

const listServicesService = async (query) => {
  const {
    page = 1,
    limit = 10,
    workshopId,
    categoryId,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (workshopId) {
    filter.workshopId = workshopId;
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  if (status) {
    filter.isActive = status === "ACTIVE";
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { slug: regex }, { serviceType: regex }];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [services, total] = await Promise.all([
    Service.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("workshopId", "name code")
      .populate("categoryId", "name slug"),
    Service.countDocuments(filter),
  ]);

  return {
    services,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateServiceService = async (serviceId, updateData) => {
  const service = await Service.findById(serviceId);

  if (!service) {
    throw new ApiError(404, "Service not found");
  }

  if (updateData.categoryId) {
    await validateWorkshopAndCategory(null, updateData.categoryId);
  }

  if (updateData.slug || updateData.name) {
    const nextSlug = updateData.slug && updateData.slug.trim() !== ""
      ? updateData.slug
      : updateData.name
        ? slugify(updateData.name)
        : service.slug;

    if (nextSlug !== service.slug) {
      await ensureUniqueSlug(nextSlug, service.workshopId, service._id);
      updateData.slug = nextSlug;
    } else if (updateData.slug) {
      updateData.slug = nextSlug;
    }
  }

  Object.assign(service, updateData);

  await service.save();

  logger.info(`Service updated: ${service._id}`);

  return service;
};

const deleteServiceService = async (serviceId) => {
  const service = await Service.findById(serviceId);

  if (!service) {
    throw new ApiError(404, "Service not found");
  }

  service.isActive = false;

  await service.save();

  logger.info(`Service deactivated (soft): ${service._id}`);

  return { _id: service._id, isActive: service.isActive };
};

module.exports = {
  createServiceService,
  getServiceByIdService,
  listServicesService,
  updateServiceService,
  deleteServiceService,
};