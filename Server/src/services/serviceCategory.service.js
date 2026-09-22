const ApiError = require("../utils/ApiError.js");
const ServiceCategory = require("../models/ServiceCategory.js");
const logger = require("../utils/logger.js");

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createServiceCategoryService = async (categoryData) => {
  const { name, slug } = categoryData;

  const resolvedSlug = slug && slug.trim() !== "" ? slug : slugify(name);

  const existingCategory = await ServiceCategory.findOne({ slug: resolvedSlug });

  if (existingCategory) {
    throw new ApiError(409, "A service category with this slug already exists");
  }

  const category = await ServiceCategory.create({
    ...categoryData,
    slug: resolvedSlug,
  });

  logger.info(`Service category created: ${category._id}`);

  return category;
};

const getServiceCategoryByIdService = async (categoryId) => {
  const category = await ServiceCategory.findById(categoryId);

  if (!category) {
    throw new ApiError(404, "Service category not found");
  }

  return category;
};

const listServiceCategoriesService = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    sortBy = "displayOrder",
    sortOrder = "asc",
  } = query;

  const filter = {};

  if (status) {
    filter.isActive = status === "ACTIVE";
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { slug: regex }];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [categories, total] = await Promise.all([
    ServiceCategory.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    ServiceCategory.countDocuments(filter),
  ]);

  return {
    categories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateServiceCategoryService = async (categoryId, updateData) => {
  const category = await getServiceCategoryByIdService(categoryId);

  if (updateData.slug || updateData.name) {
    const nextSlug = updateData.slug && updateData.slug.trim() !== ""
      ? updateData.slug
      : updateData.name
        ? slugify(updateData.name)
        : category.slug;

    if (nextSlug !== category.slug) {
      const existingCategory = await ServiceCategory.findOne({ slug: nextSlug, _id: { $ne: category._id } });

      if (existingCategory) {
        throw new ApiError(409, "A service category with this slug already exists");
      }

      updateData.slug = nextSlug;
    } else if (updateData.slug) {
      updateData.slug = nextSlug;
    }
  }

  Object.assign(category, updateData);

  await category.save();

  logger.info(`Service category updated: ${category._id}`);

  return category;
};

const deleteServiceCategoryService = async (categoryId) => {
  const category = await getServiceCategoryByIdService(categoryId);

  category.isActive = false;

  await category.save();

  logger.info(`Service category deactivated (soft): ${category._id}`);

  return { _id: category._id, isActive: category.isActive };
};

module.exports = {
  createServiceCategoryService,
  getServiceCategoryByIdService,
  listServiceCategoriesService,
  updateServiceCategoryService,
  deleteServiceCategoryService,
};