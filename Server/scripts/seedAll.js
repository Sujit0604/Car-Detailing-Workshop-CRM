const connectDB = require("../src/config/db.js");
const User = require("../src/models/User.js");
const Workshop = require("../src/models/Workshop.js");
const ServiceCategory = require("../src/models/ServiceCategory.js");
const Service = require("../src/models/Service.js");
const Coupon = require("../src/models/Coupon.js");
const Vehicle = require("../src/models/Vehicle.js");
const Mechanic = require("../src/models/Mechanic.js");
const Booking = require("../src/models/Booking.js");
const Job = require("../src/models/Job.js");
const Estimate = require("../src/models/Estimate.js");
const InventoryPart = require("../src/models/InventoryPart.js");
const Media = require("../src/models/Media.js");
const logger = require("../src/utils/logger.js");

const pad = (n, w) => String(n).padStart(w, "0");
const img = (seed) => `https://picsum.photos/seed/${seed}/800/600`;
const round2 = (n) => Math.round(n * 100) / 100;
const addDays = (d, n) => new Date(d.getTime() + n * 24 * 60 * 60 * 1000);
const iso = (d) => d.toISOString();

const priceBreakup = (items, discount = 0) => {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = round2(subtotal * 0.18);
  return { subtotal: round2(subtotal), discount, tax, total: round2(subtotal - discount + tax) };
};

const WORKSHOPS = [
  {
    code: "SHAIN-01",
    name: "Shain Detailing Studio",
    description: "Premium exterior & interior detailing studio.",
    phone: "+91-9876543210",
    email: "shain@example.com",
    address: { line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", country: "India", postalCode: "560001" },
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
    address: { line1: "45 Outer Ring Road", city: "Hyderabad", state: "Telangana", country: "India", postalCode: "500032" },
    slotDurationMinutes: 45,
    maxBookingsPerSlot: 3,
    status: "ACTIVE",
  },
];

const DAYS = [
  { day: "MONDAY", open: "09:00", close: "19:00", isClosed: false },
  { day: "TUESDAY", open: "09:00", close: "19:00", isClosed: false },
  { day: "WEDNESDAY", open: "09:00", close: "19:00", isClosed: false },
  { day: "THURSDAY", open: "09:00", close: "19:00", isClosed: false },
  { day: "FRIDAY", open: "09:00", close: "20:00", isClosed: false },
  { day: "SATURDAY", open: "09:00", close: "20:00", isClosed: false },
  { day: "SUNDAY", open: "10:00", close: "17:00", isClosed: false },
];

const CATEGORIES = [
  { name: "Interior Detailing", slug: "interior-detailing", description: "Deep cleaning and conditioning of the cabin.", displayOrder: 1, isActive: true },
  { name: "Exterior Detailing", slug: "exterior-detailing", description: "Paint, polish and exterior surface care.", displayOrder: 2, isActive: true },
  { name: "Repair & Maintenance", slug: "repair-maintenance", description: "Mechanical repairs and periodic maintenance.", displayOrder: 3, isActive: true },
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
      { slug: "brake-service", name: "Brake Service", categorySlug: "repair-maintenance", serviceType: "REPAIR", pricingType: "STARTING_FROM", basePrice: 1400, estimatedDurationMinutes: 120 },
      { slug: "engine-diagnostics", name: "Engine Diagnostics", categorySlug: "repair-maintenance", serviceType: "INSPECTION", pricingType: "FIXED", basePrice: 800, estimatedDurationMinutes: 60 },
      { slug: "oil-change", name: "Engine Oil Change", categorySlug: "repair-maintenance", serviceType: "MAINTENANCE", pricingType: "FIXED", basePrice: 900, estimatedDurationMinutes: 60 },
    ],
  },
];

const USERS = [
  { name: "Admin Krom", email: "admin@kromdetail.com", password: "Admin@123", gender: "other", phone: "9990000001", role: "ADMIN" },
  { name: "Aarav Sharma", email: "aarav@kromdetail.com", password: "Staff@123", gender: "male", phone: "9871000001", role: "WORKSHOP_MANAGER", workshopCode: "SHAIN-01" },
  { name: "Meera Iyer", email: "meera@kromdetail.com", password: "Staff@123", gender: "female", phone: "9871000002", role: "WORKSHOP_MANAGER", workshopCode: "SPEED-02" },
  { name: "Rohan Mehta", email: "rohan@kromdetail.com", password: "Staff@123", gender: "male", phone: "9871000003", role: "SERVICE_ADVISOR", workshopCode: "SHAIN-01" },
  { name: "Divya Rao", email: "divya@kromdetail.com", password: "Staff@123", gender: "female", phone: "9871000004", role: "SERVICE_ADVISOR", workshopCode: "SPEED-02" },
  { name: "Karan Singh", email: "karan@kromdetail.com", password: "Staff@123", gender: "male", phone: "9871000005", role: "MECHANIC" },
  { name: "Vikram Yadav", email: "vikram@kromdetail.com", password: "Staff@123", gender: "male", phone: "9871000006", role: "MECHANIC" },
  { name: "Anil Kumar", email: "anil@kromdetail.com", password: "Staff@123", gender: "male", phone: "9871000007", role: "MECHANIC" },
  { name: "Suresh Patel", email: "suresh@kromdetail.com", password: "Staff@123", gender: "male", phone: "9871000008", role: "MECHANIC" },
  { name: "Priya Sharma", email: "priya@example.com", password: "Customer@123", gender: "female", phone: "9872000001", role: "CUSTOMER" },
  { name: "Arjun Nair", email: "arjun@example.com", password: "Customer@123", gender: "male", phone: "9872000002", role: "CUSTOMER" },
  { name: "Sweety Das", email: "sweety@example.com", password: "Customer@123", gender: "female", phone: "9872000003", role: "CUSTOMER" },
];

const MECHANICS = [
  { email: "karan@kromdetail.com", workshopCode: "SHAIN-01", employeeCode: "MECH-SHAIN-01", specialization: ["DETAILING", "BODY", "PAINT"], experienceYears: 7 },
  { email: "vikram@kromdetail.com", workshopCode: "SHAIN-01", employeeCode: "MECH-SHAIN-02", specialization: ["DETAILING", "ENGINE"], experienceYears: 5 },
  { email: "anil@kromdetail.com", workshopCode: "SPEED-02", employeeCode: "MECH-SPEED-01", specialization: ["ENGINE", "BRAKES", "GENERAL"], experienceYears: 9 },
  { email: "suresh@kromdetail.com", workshopCode: "SPEED-02", employeeCode: "MECH-SPEED-02", specialization: ["ELECTRICAL", "AC", "TYRE"], experienceYears: 6 },
];

const VEHICLES = [
  { reg: "KA-01-MC-1234", owner: "priya@example.com", make: "Hyundai", model: "Creta", variant: "SX", year: 2022, fuel: "PETROL", trans: "AUTOMATIC", color: "Pearl White", odometer: 18400, imgSeed: "creta-white" },
  { reg: "TS-09-AB-1122", owner: "priya@example.com", make: "Tata", model: "Nexon", variant: "XZ+", year: 2023, fuel: "PETROL", trans: "AUTOMATIC", color: "Grey", odometer: 9800, imgSeed: "nexon-grey" },
  { reg: "KA-05-MQ-4321", owner: "arjun@example.com", make: "Maruti Suzuki", model: "Swift", variant: "ZXi", year: 2021, fuel: "PETROL", trans: "MANUAL", color: "Red", odometer: 31200, imgSeed: "swift-red" },
  { reg: "TS-10-CD-3344", owner: "arjun@example.com", make: "Honda", model: "City", variant: "VX", year: 2020, fuel: "PETROL", trans: "CVT", color: "Silver", odometer: 42500, imgSeed: "city-silver" },
  { reg: "KA-53-EF-5566", owner: "sweety@example.com", make: "Toyota", model: "Innova Crysta", variant: "GX", year: 2021, fuel: "DIESEL", trans: "MANUAL", color: "Black", odometer: 24500, imgSeed: "innova-black" },
  { reg: "KA-04-GH-7788", owner: "sweety@example.com", make: "Mahindra", model: "Thar", variant: "LX", year: 2023, fuel: "DIESEL", trans: "MANUAL", color: "Red", odometer: 8200, imgSeed: "thar-red" },
];

const COUPONS = [
  { code: "KROM10", description: "10% off on first service", discountType: "PERCENTAGE", discountValue: 10, maximumDiscount: 500, minimumOrderValue: 1000, usageLimit: 100, perUserLimit: 1, status: "ACTIVE" },
  { code: "KROM500", description: "Flat ₹500 off above ₹5000", discountType: "FIXED", discountValue: 500, minimumOrderValue: 5000, usageLimit: 50, perUserLimit: 1, status: "ACTIVE" },
];

const BOOKINGS = [
  {
    num: 1, customer: "priya@example.com", workshop: "SHAIN-01", vehicle: "KA-01-MC-1234", status: "COMPLETED", payment: "PAID", date: "2026-09-05",
    services: [{ slug: "full-body-polish", qty: 1 }, { slug: "interior-deep-clean", qty: 1 }],
    notes: "Customer wanted extra care on headliner stains.",
  },
  {
    num: 2, customer: "arjun@example.com", workshop: "SHAIN-01", vehicle: "KA-05-MQ-4321", status: "VEHICLE_RECEIVED", payment: "PARTIAL", date: "2026-09-10",
    services: [{ slug: "ceramic-coating", qty: 1 }],
    notes: "Test drive car, coating planned for 2 days.",
  },
  {
    num: 3, customer: "sweety@example.com", workshop: "SHAIN-01", vehicle: "KA-53-EF-5566", status: "VEHICLE_RECEIVED", payment: "PENDING", date: "2026-09-12",
    services: [{ slug: "seat-shampooing", qty: 1 }],
  },
  {
    num: 4, customer: "priya@example.com", workshop: "SPEED-02", vehicle: "TS-09-AB-1122", status: "IN_PROGRESS", payment: "PARTIAL", date: "2026-09-20",
    services: [{ slug: "brake-service", qty: 1 }],
  },
  {
    num: 5, customer: "arjun@example.com", workshop: "SPEED-02", vehicle: "TS-10-CD-3344", status: "IN_PROGRESS", payment: "PENDING", date: "2026-09-21",
    services: [{ slug: "engine-diagnostics", qty: 1 }],
    notes: "Check engine light flickering on highway.",
  },
  {
    num: 6, customer: "sweety@example.com", workshop: "SPEED-02", vehicle: "KA-04-GH-7788", status: "CONFIRMED", payment: "PENDING", date: "2026-09-28",
    services: [{ slug: "basic-service", qty: 1 }, { slug: "oil-change", qty: 1 }, { slug: "engine-diagnostics", qty: 1 }],
  },
  {
    num: 7, customer: "priya@example.com", workshop: "SHAIN-01", vehicle: "KA-01-MC-1234", status: "CONFIRMED", payment: "PAID", date: "2026-09-26",
    services: [{ slug: "full-body-polish", qty: 1 }],
    coupon: "KROM10",
  },
];

const JOBS = [
  { num: 1, booking: 1, status: "COMPLETED", mechanic: "MECH-SHAIN-01", advisor: "rohan@kromdetail.com", odometerIn: 17850, odometerOut: 18400 },
  { num: 2, booking: 2, status: "CHECK_IN", advisor: "rohan@kromdetail.com" },
  { num: 3, booking: 3, status: "INSPECTION", advisor: "rohan@kromdetail.com", mechanic: "MECH-SHAIN-01" },
  { num: 4, booking: 4, status: "IN_PROGRESS", mechanic: "MECH-SPEED-01", advisor: "divya@kromdetail.com", odometerIn: 9410 },
  { num: 5, booking: 5, status: "CUSTOMER_APPROVAL", advisor: "divya@kromdetail.com" },
  { num: 6, booking: 6, status: "ESTIMATE_PENDING", advisor: "divya@kromdetail.com" },
  { num: 7, booking: 7, status: "QUALITY_CHECK", mechanic: "MECH-SHAIN-02", advisor: "rohan@kromdetail.com", odometerIn: 18390 },
];

const ESTIMATES = [
  {
    num: 1, job: 1, version: 1, by: "rohan@kromdetail.com", status: "APPROVED",
    items: [
      { type: "SERVICE", name: "Full Body Polish", quantity: 1, unitPrice: 3000 },
      { type: "SERVICE", name: "Interior Deep Clean", quantity: 1, unitPrice: 2500 },
      { type: "PART", name: "Microfiber Towel Pack", quantity: 1, unitPrice: 300 },
    ],
    discount: 300,
    response: { remarks: "Looks good, go ahead." },
  },
  {
    num: 4, job: 4, version: 1, by: "divya@kromdetail.com", status: "APPROVED",
    items: [
      { type: "LABOUR", name: "Brake Disc & Pad Service", quantity: 2, unitPrice: 500 },
      { type: "PART", name: "Brake Pads - Front Set", quantity: 1, unitPrice: 2200 },
    ],
    response: { remarks: "Approved, budget is fine." },
  },
  {
    num: 5, job: 5, version: 1, by: "divya@kromdetail.com", status: "PENDING_APPROVAL",
    items: [
      { type: "LABOUR", name: "Engine Diagnostics", quantity: 1, unitPrice: 800 },
      { type: "PART", name: "Oxygen Sensor (if needed)", quantity: 1, unitPrice: 1450 },
    ],
  },
  {
    num: 6, job: 6, version: 1, by: "divya@kromdetail.com", status: "REJECTED",
    items: [
      { type: "SERVICE", name: "Basic Service", quantity: 1, unitPrice: 1500 },
      { type: "SERVICE", name: "Engine Oil Change", quantity: 1, unitPrice: 900 },
    ],
    response: { remarks: "Too expensive, need a revised quote." },
  },
  {
    num: 7, job: 7, version: 1, by: "rohan@kromdetail.com", status: "APPROVED",
    items: [
      { type: "SERVICE", name: "Full Body Polish", quantity: 1, unitPrice: 3000 },
      { type: "PART", name: "Paint Sealant 250ml", quantity: 1, unitPrice: 450 },
    ],
    response: { remarks: "Approved." },
  },
];

const INVENTORY = [
  { workshop: "SHAIN-01", partNumber: "WP-1001", name: "Premium Microfiber Towels", category: "DETAILING", brand: "EchoTowel", unit: "pcs", purchasePrice: 80, sellingPrice: 120, quantity: 24, reorderLevel: 30, maxStockLevel: 80, supplier: "Bengaluru Supplies" },
  { workshop: "SHAIN-01", partNumber: "WP-1002", name: "Ceramic Polish Compound 500ml", category: "DETAILING", brand: "KROME", unit: "bottle", purchasePrice: 420, sellingPrice: 650, quantity: 6, reorderLevel: 4, maxStockLevel: 20, supplier: "AutoCare Wholesale" },
  { workshop: "SHAIN-01", partNumber: "WP-1003", name: "Foam Shampoo 5L", category: "DETAILING", brand: "SnowFoam", unit: "can", purchasePrice: 380, sellingPrice: 560, quantity: 12, reorderLevel: 8, maxStockLevel: 25, supplier: "AutoCare Wholesale" },
  { workshop: "SHAIN-01", partNumber: "WP-1004", name: "Clay Bar Kit", category: "DETAILING", brand: "GlazePro", unit: "kit", purchasePrice: 240, sellingPrice: 400, quantity: 3, reorderLevel: 5, maxStockLevel: 12 },
  { workshop: "SHAIN-01", partNumber: "WP-1005", name: "Alloy Wheel Cleaner 1L", category: "DETAILING", brand: "WheelFX", unit: "bottle", purchasePrice: 180, sellingPrice: 300, quantity: 9, reorderLevel: 6, maxStockLevel: 18 },
  { workshop: "SPEED-02", partNumber: "MP-2001", name: "Engine Oil SAE 5W-30 4L", category: "ENGINE", brand: "Castrol", unit: "can", purchasePrice: 1200, sellingPrice: 1650, quantity: 15, reorderLevel: 10, maxStockLevel: 30, supplier: "Hyderabad Auto Parts" },
  { workshop: "SPEED-02", partNumber: "MP-2002", name: "Brake Pads - Front Set", category: "BRAKES", brand: "Bosch", unit: "set", purchasePrice: 1400, sellingPrice: 2200, quantity: 4, reorderLevel: 3, maxStockLevel: 10, supplier: "Hyderabad Auto Parts" },
  { workshop: "SPEED-02", partNumber: "MP-2003", name: "Oil Filter", category: "ENGINE", brand: "Mann", unit: "pcs", purchasePrice: 180, sellingPrice: 320, quantity: 20, reorderLevel: 15, maxStockLevel: 40 },
  { workshop: "SPEED-02", partNumber: "MP-2004", name: "Air Filter", category: "ENGINE", brand: "Bosch", unit: "pcs", purchasePrice: 260, sellingPrice: 450, quantity: 8, reorderLevel: 10, maxStockLevel: 20 },
  { workshop: "SPEED-02", partNumber: "MP-2005", name: "Spark Plug Set", category: "ENGINE", brand: "NGK", unit: "set", purchasePrice: 520, sellingPrice: 800, quantity: 10, reorderLevel: 8, maxStockLevel: 20 },
];

const MEDIA = [
  { ownerType: "VEHICLE", ownerKey: "KA-01-MC-1234", category: "VEHICLE", by: "priya@example.com", seeds: ["creta-front", "creta-side"] },
  { ownerType: "VEHICLE", ownerKey: "KA-05-MQ-4321", category: "VEHICLE", by: "arjun@example.com", seeds: ["swift-front", "swift-interior"] },
  { ownerType: "JOB", ownerKey: 2, category: "BEFORE", by: "rohan@kromdetail.com", seeds: ["job2-before-1", "job2-before-2"] },
  { ownerType: "JOB", ownerKey: 3, category: "BEFORE", by: "rohan@kromdetail.com", seeds: ["job3-before-1", "job3-before-2"] },
  { ownerType: "JOB", ownerKey: 3, category: "DAMAGE", by: "rohan@kromdetail.com", seeds: ["job3-scratch-door"] },
  { ownerType: "JOB", ownerKey: 4, category: "BEFORE", by: "anil@kromdetail.com", seeds: ["job4-brake-worn"] },
  { ownerType: "JOB", ownerKey: 4, category: "AFTER", by: "anil@kromdetail.com", seeds: ["job4-brake-fresh", "job4-wheel-finish"] },
  { ownerType: "JOB", ownerKey: 7, category: "AFTER", by: "vikram@kromdetail.com", seeds: ["job7-polish-1", "job7-gloss-2"] },
  { ownerType: "JOB", ownerKey: 1, category: "AFTER", by: "rohan@kromdetail.com", seeds: ["job1-after-1", "job1-after-2", "job1-interior-after"] },
  { ownerType: "USER", ownerKey: "priya@example.com", category: "PROFILE", by: "admin@kromdetail.com", seeds: ["priya-profile"] },
];

const upsertByQuery = async (Model, query, data) => {
  const existing = await Model.findOne(query);
  if (existing) return existing;
  return Model.create(data);
};

const seed = async () => {
  try {
    await connectDB();

    const counts = {};

    await Promise.all(CATEGORIES.map((c) => upsertByQuery(ServiceCategory, { slug: c.slug }, c)));
    counts.categories = await ServiceCategory.countDocuments();

    const categoryMap = new Map((await ServiceCategory.find()).map((c) => [c.slug, c._id]));

    for (const ws of WORKSHOPS) {
      const doc = { ...ws, openingHours: DAYS, location: { type: "Point", coordinates: ws.code === "SHAIN-01" ? [77.5946, 12.9716] : [78.4867, 17.385] } };
      await upsertByQuery(Workshop, { code: ws.code }, doc);
    }
    counts.workshops = await Workshop.countDocuments();

    const workshopMap = new Map((await Workshop.find()).map((w) => [w.code, w._id]));

    for (const { code, items } of SERVICES) {
      for (const item of items) {
        await upsertByQuery(
          Service,
          { workshopId: workshopMap.get(code), slug: item.slug },
          { ...item, categoryId: categoryMap.get(item.categorySlug), workshopId: workshopMap.get(code) }
        );
      }
    }
    counts.services = await Service.countDocuments();

    const serviceMap = new Map();
    for (const s of await Service.find()) serviceMap.set(`${s.workshopId}_${s.slug}`, s);

    for (const u of USERS) {
      const { workshopCode, ...userFields } = u;
      const existing = await User.findOne({ email: u.email });
      const userData = {
        ...userFields,
        needsVerification: false,
        emailVerified: true,
        phoneVerified: true,
        status: "ACTIVE",
        threeDayExpires: iso(addDays(new Date(), 3)),
        workshopId: workshopCode ? workshopMap.get(workshopCode)?._id || null : null,
      };
      if (existing) {
        if ((existing.workshopId?.toString() || null) !== (userData.workshopId?.toString() || null)) {
          existing.workshopId = userData.workshopId || null;
          await existing.save();
        }
      } else {
        await User.create(userData);
      }
    }
    counts.users = await User.countDocuments();

    const userMap = new Map((await User.find()).map((u) => [u.email, u]));

    for (const m of MECHANICS) {
      const userId = userMap.get(m.email)?._id;
      if (!userId) continue;
      await upsertByQuery(
        Mechanic,
        { employeeCode: m.employeeCode },
        { userId, workshopId: workshopMap.get(m.workshopCode), employeeCode: m.employeeCode, specialization: m.specialization, experienceYears: m.experienceYears }
      );
    }
    counts.mechanics = await Mechanic.countDocuments();

    const mechanicMap = new Map((await Mechanic.find()).map((m) => [m.employeeCode, m]));

    for (const v of VEHICLES) {
      const ownerId = userMap.get(v.owner)?._id;
      if (!ownerId) continue;
      const images = Array.from({ length: 2 }, (_, i) => ({ url: img(`${v.imgSeed}-${i + 1}`), publicId: null }));
      await upsertByQuery(
        Vehicle,
        { registrationNumber: v.reg },
        {
          ownerId,
          registrationNumber: v.reg,
          make: v.make,
          model: v.model,
          variant: v.variant,
          manufacturingYear: v.year,
          fuelType: v.fuel,
          transmission: v.trans,
          color: v.color,
          odometer: v.odometer,
          images,
        }
      );
    }
    counts.vehicles = await Vehicle.countDocuments();

    const vehicleMap = new Map((await Vehicle.find()).map((v) => [v.registrationNumber, v]));

    for (const c of COUPONS) {
      await upsertByQuery(
        Coupon,
        { code: c.code },
        { ...c, validFrom: iso(addDays(new Date(), -10)), validUntil: iso(addDays(new Date(), 60)) }
      );
    }
    counts.coupons = await Coupon.countDocuments();

    const couponMap = new Map((await Coupon.find()).map((c) => [c.code, c]));

    for (const b of BOOKINGS) {
      const existing = await Booking.findOne({ bookingNumber: `BKG-2026-${pad(b.num, 4)}` });
      if (existing) continue;
      const workshopId = workshopMap.get(b.workshop);
      const services = b.services.map(({ slug, qty }) => {
        const s = serviceMap.get(`${workshopId}_${slug}`);
        return {
          serviceId: s._id,
          serviceName: s.name,
          quantity: qty,
          unitPrice: s.basePrice,
          estimatedPrice: s.basePrice * qty,
          durationMinutes: s.estimatedDurationMinutes,
        };
      });
      const pricing = priceBreakup(services.map((s) => ({ quantity: s.quantity, unitPrice: s.unitPrice })), 0);
      await Booking.create({
        bookingNumber: `BKG-2026-${pad(b.num, 4)}`,
        customerId: userMap.get(b.customer)._id,
        vehicleId: vehicleMap.get(b.vehicle)._id,
        workshopId,
        appointment: { date: new Date(b.date), startTime: "10:00", endTime: "12:00", slotId: `SLOT-${b.date}-1000` },
        services,
        pricing,
        couponId: b.coupon ? couponMap.get(b.coupon)?._id : null,
        status: b.status,
        paymentStatus: b.payment,
        customerNotes: b.notes,
      });
    }
    counts.bookings = await Booking.countDocuments();

    const bookingMap = new Map((await Booking.find()).map((b) => [b.bookingNumber, b]));

    for (const j of JOBS) {
      const existing = await Job.findOne({ jobNumber: `JOB-2026-${pad(j.num, 4)}` });
      if (existing) continue;
      const booking = bookingMap.get(`BKG-2026-${pad(j.booking, 4)}`);
      const mechanic = j.mechanic ? mechanicMap.get(j.mechanic) : null;
      const jobData = {
        jobNumber: `JOB-2026-${pad(j.num, 4)}`,
        bookingId: booking._id,
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        workshopId: booking.workshopId,
        status: j.status,
        serviceAdvisorId: userMap.get(j.advisor)?._id || null,
        internalNotes: "Seeded demo job for workshop flow.",
      };
      if (mechanic) jobData.assignedMechanicId = mechanic._id;
      if (j.odometerIn) jobData.odometerIn = j.odometerIn;
      if (j.odometerOut) jobData.odometerOut = j.odometerOut;
      if (j.status === "COMPLETED") {
        jobData.startedAt = iso(addDays(new Date(), -3));
        jobData.completedAt = iso(addDays(new Date(), -2));
        jobData.expectedCompletionAt = iso(addDays(new Date(), -2));
      } else if (j.status === "IN_PROGRESS" || j.status === "QUALITY_CHECK") {
        jobData.startedAt = iso(addDays(new Date(), -1));
        jobData.expectedCompletionAt = iso(addDays(new Date(), 1));
      } else if (j.status === "CHECK_IN") {
        jobData.checkInAt = iso(addDays(new Date(), -2));
      }
      await Job.create(jobData);
    }
    counts.jobs = await Job.countDocuments();

    const jobMap = new Map((await Job.find()).map((j) => [Number(j.jobNumber.split("-")[2]), j]));

    for (const e of ESTIMATES) {
      const existing = await Estimate.findOne({ estimateNumber: `EST-2026-${pad(e.num, 3)}` });
      if (existing) continue;
      const job = jobMap.get(e.job);
      if (!job) continue;
      const pricing = priceBreakup(e.items, e.discount || 0);
      const estimateData = {
        estimateNumber: `EST-2026-${pad(e.num, 3)}`,
        jobId: job._id,
        version: e.version,
        createdBy: userMap.get(e.by)._id,
        items: e.items.map((i) => ({ ...i, total: round2(i.quantity * i.unitPrice) })),
        pricing,
        status: e.status,
      };
      if (e.response) {
        estimateData.customerResponse = {
          respondedAt: iso(addDays(new Date(), -1)),
          respondedBy: userMap.get(job.customerId) ? job.customerId : null,
          remarks: e.response.remarks,
        };
      }
      await Estimate.create(estimateData);
    }
    counts.estimates = await Estimate.countDocuments();

    for (const part of INVENTORY) {
      await upsertByQuery(
        InventoryPart,
        { workshopId: workshopMap.get(part.workshop), partNumber: part.partNumber },
        {
          workshopId: workshopMap.get(part.workshop),
          partNumber: part.partNumber,
          name: part.name,
          category: part.category,
          brand: part.brand,
          unit: part.unit,
          purchasePrice: part.purchasePrice,
          sellingPrice: part.sellingPrice,
          stock: {
            quantity: part.quantity,
            reservedQuantity: Math.min(part.quantity, 1),
            reorderLevel: part.reorderLevel,
            maxStockLevel: part.maxStockLevel,
          },
          supplier: part.supplier ? { name: part.supplier } : undefined,
          status: "ACTIVE",
        }
      );
    }
    counts.inventory = await InventoryPart.countDocuments();

    for (const m of MEDIA) {
      let ownerId;
      if (m.ownerType === "VEHICLE") ownerId = vehicleMap.get(m.ownerKey)?._id;
      else if (m.ownerType === "JOB") ownerId = jobMap.get(m.ownerKey)?._id;
      else if (m.ownerType === "USER") ownerId = userMap.get(m.ownerKey)?._id;
      const uploadedBy = userMap.get(m.by)?._id;
      if (!ownerId || !uploadedBy) continue;
      const existing = await Media.countDocuments({ ownerType: m.ownerType, ownerId, category: m.category });
      if (existing > 0) continue;
      await Media.insertMany(
        m.seeds.map((seed) => ({
          ownerType: m.ownerType,
          ownerId,
          url: img(seed),
          resourceType: "IMAGE",
          category: m.category,
          uploadedBy,
        }))
      );
    }
    counts.media = await Media.countDocuments();

    logger.info(`Seeding complete. Counts: ${JSON.stringify(counts)}`);
    logger.info("Demo accounts — Admin: admin@kromdetail.com / Admin@123 | Staff: <name>@kromdetail.com / Staff@123 | Customer: priya@|arjun@|sweety@example.com / Customer@123");
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    if (error.errors) logger.error(JSON.stringify(error.errors));
    process.exit(1);
  }
};

seed();