const connectDB = require("../src/config/db.js");
const Workshop = require("../src/models/Workshop.js");
const ServiceCategory = require("../src/models/ServiceCategory.js");
const Service = require("../src/models/Service.js");
const logger = require("../src/utils/logger.js");

const WORKSHOPS = [
  {
    code: "SHAIN-01",
    name: "Shain Detailing Studio",
    description: "Premium exterior & interior detailing studio.",
    phone: "+91-9876543210",
    email: "shain@example.com",
    address: {
      line1: "12 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      postalCode: "560001",
    },
    openingHours: [
      { day: "MONDAY", open: "09:00", close: "19:00", isClosed: false },
      { day: "TUESDAY", open: "09:00", close: "19:00", isClosed: false },
      { day: "WEDNESDAY", open: "09:00", close: "19:00", isClosed: false },
      { day: "THURSDAY", open: "09:00", close: "19:00", isClosed: false },
      { day: "FRIDAY", open: "09:00", close: "20:00", isClosed: false },
      { day: "SATURDAY", open: "09:00", close: "20:00", isClosed: false },
      { day: "SUNDAY", open: "10:00", close: "17:00", isClosed: false },
    ],
    slotDurationMinutes: 60,
    maxBookingsPerSlot: 2,
    status: "ACTIVE",
  },
  {
    code: "SPEED-02",
    name: "Speed X Performance",
    description: "Repair, maintenance and performance upgrades.",
    phone: "+91-9988776655",
    email: "speedx@example.com",
    address: {
      line1: "45 Outer Ring Road",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      postalCode: "500032",
    },
    openingHours: [
      { day: "MONDAY", open: "08:00", close: "18:00", isClosed: false },
      { day: "TUESDAY", open: "08:00", close: "18:00", isClosed: false },
      { day: "WEDNESDAY", open: "08:00", close: "18:00", isClosed: false },
      { day: "THURSDAY", open: "08:00", close: "18:00", isClosed: false },
      { day: "FRIDAY", open: "08:00", close: "18:00", isClosed: false },
      { day: "SATURDAY", open: "09:00", close: "16:00", isClosed: false },
      { day: "SUNDAY", open: "09:00", close: "13:00", isClosed: true },
    ],
    slotDurationMinutes: 45,
    maxBookingsPerSlot: 3,
    status: "ACTIVE",
  },
];

const CATEGORIES = [
  {
    name: "Interior Detailing",
    slug: "interior-detailing",
    description: "Deep cleaning and conditioning of the cabin.",
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "Exterior Detailing",
    slug: "exterior-detailing",
    description: "Paint, polish and exterior surface care.",
    displayOrder: 2,
    isActive: true,
  },
  {
    name: "Repair & Maintenance",
    slug: "repair-maintenance",
    description: "Mechanical repairs and periodic maintenance.",
    displayOrder: 3,
    isActive: true,
  },
];

const SERVICES = [
  {
    code: "SHAIN-01",
    items: [
      { slug: "full-body-polish", name: "Full Body Polish", categorySlug: "exterior-detailing", serviceType: "DETAILING", pricingType: "FIXED", basePrice: 3000, estimatedDurationMinutes: 180 },
      { slug: "interior-deep-clean", name: "Interior Deep Clean", categorySlug: "interior-detailing", serviceType: "DETAILING", pricingType: "FIXED", basePrice: 2500, estimatedDurationMinutes: 150 },
      { slug: "ceramic-coating", name: "Ceramic Coating", categorySlug: "exterior-detailing", serviceType: "DETAILING", pricingType: "INSPECTION_REQUIRED", basePrice: 9000, estimatedDurationMinutes: 360 },
      { slug: "seat-shampooing", name: "Seat Shampooing", categorySlug: "interior-detailing", serviceType: "DETAILING", pricingType: "FIXED", basePrice: 1800, estimatedDurationMinutes: 120 },
    ],
  },
  {
    code: "SPEED-02",
    items: [
      { slug: "basic-service", name: "Basic Service", categorySlug: "repair-maintenance", serviceType: "MAINTENANCE", pricingType: "FIXED", basePrice: 1500, estimatedDurationMinutes: 90 },
      { slug: "brake-service", name: "Brake Service", categorySlug: "repair-maintenance", serviceType: "REPAIR", pricingType: "STARTING_FROM", basePrice: 1200, estimatedDurationMinutes: 120 },
      { slug: "engine-diagnostics", name: "Engine Diagnostics", categorySlug: "repair-maintenance", serviceType: "INSPECTION", pricingType: "FIXED", basePrice: 800, estimatedDurationMinutes: 60 },
      { slug: "oil-change", name: "Engine Oil Change", categorySlug: "repair-maintenance", serviceType: "MAINTENANCE", pricingType: "FIXED", basePrice: 900, estimatedDurationMinutes: 60 },
    ],
  },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const seed = async () => {
  try {
    await connectDB();

    let created = 0;
    let skipped = 0;

    for (const cat of CATEGORIES) {
      await ServiceCategory.updateOne(
        { slug: cat.slug },
        { $set: cat },
        { upsert: true }
      );
    }

    const categoryMap = new Map((await ServiceCategory.find()).map((c) => [c.slug, c._id]));

    for (const ws of WORKSHOPS) {
      const workshop = await Workshop.updateOne(
        { code: ws.code },
        { $set: ws },
        { upsert: true }
      );

      if (workshop.upsertedCount > 0) created++;
      else skipped++;
    }

    const workshopMap = new Map((await Workshop.find()).map((w) => [w.code, w._id]));

    for (const { code, items } of SERVICES) {
      const workshopId = workshopMap.get(code);
      if (!workshopId) continue;

      for (const item of items) {
        const categoryId = categoryMap.get(item.categorySlug);
        if (!categoryId) continue;

        const slug = slugify(item.name);
        const { categorySlug, ...rest } = item;

        await Service.updateOne(
          { workshopId, slug },
          {
            $set: {
              ...rest,
              categoryId,
              slug,
            },
          },
          { upsert: true }
        );
      }
    }

    logger.info(`Seeding complete. Workshops created: ${created}, skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seed();