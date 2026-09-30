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
const Inspection = require("../src/models/Inspection.js");
const JobTask = require("../src/models/JobTask.js");
const JobPart = require("../src/models/JobPart.js");
const Invoice = require("../src/models/Invoice.js");
const Payment = require("../src/models/Payment.js");
const Review = require("../src/models/Review.js");
const Notification = require("../src/models/Notification.js");
const AuditLog = require("../src/models/AuditLog.js");
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
  { name: "Karan Singh", email: "karan@kromdetail.com", password: "Staff@123", gender: "male", phone: "9871000005", role: "MECHANIC", workshopCode: "SHAIN-01" },
  { name: "Vikram Yadav", email: "vikram@kromdetail.com", password: "Staff@123", gender: "male", phone: "9871000006", role: "MECHANIC", workshopCode: "SHAIN-01" },
  { name: "Anil Kumar", email: "anil@kromdetail.com", password: "Staff@123", gender: "male", phone: "9871000007", role: "MECHANIC", workshopCode: "SPEED-02" },
  { name: "Suresh Patel", email: "suresh@kromdetail.com", password: "Staff@123", gender: "male", phone: "9871000008", role: "MECHANIC", workshopCode: "SPEED-02" },
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
  { num: 1, booking: 1, status: "COMPLETED", mechanic: "MECH-SHAIN-01", advisor: "rohan@kromdetail.com", manager: "aarav@kromdetail.com", odometerIn: 17850, odometerOut: 18400 },
  { num: 2, booking: 2, status: "CHECK_IN", advisor: "rohan@kromdetail.com", manager: "aarav@kromdetail.com" },
  { num: 3, booking: 3, status: "INSPECTION", advisor: "rohan@kromdetail.com", mechanic: "MECH-SHAIN-01", manager: "aarav@kromdetail.com" },
  { num: 4, booking: 4, status: "IN_PROGRESS", mechanic: "MECH-SPEED-01", advisor: "divya@kromdetail.com", manager: "meera@kromdetail.com", odometerIn: 9410 },
  { num: 5, booking: 5, status: "CUSTOMER_APPROVAL", advisor: "divya@kromdetail.com", manager: "meera@kromdetail.com" },
  { num: 6, booking: 6, status: "ESTIMATE_PENDING", advisor: "divya@kromdetail.com", manager: "meera@kromdetail.com" },
  { num: 7, booking: 7, status: "QUALITY_CHECK", mechanic: "MECH-SHAIN-02", advisor: "rohan@kromdetail.com", manager: "aarav@kromdetail.com", odometerIn: 18390 },
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

const INSPECTIONS = [
  {
    num: 1, job: 3, inspector: "karan@kromdetail.com", inspectionType: "INITIAL", status: "DRAFT", odometerReading: 24480, fuelLevel: 70,
    exteriorCondition: "Minor stone chips and light swirl marks on the bonnet.",
    interiorCondition: "Front passenger seat has a faint stain; dashboard is clean.",
    notes: "Pre-coating check requested by the customer.",
    items: [
      { component: "Front bumper", condition: "FAIR", notes: "Small chips near the parking sensor trim.", imageSeeds: ["inspection-job3-bumper"], recommendedAction: "Touch up before applying ceramic coating." },
      { component: "Paint surface", condition: "FAIR", notes: "Fine swirl marks are visible under direct light.", imageSeeds: ["inspection-job3-paint"], recommendedAction: "Use a single-stage polish before coating." },
      { component: "Front passenger seat", condition: "GOOD", notes: "No significant staining after vacuuming.", imageSeeds: [], recommendedAction: "No action required." },
    ],
  },
  {
    num: 2, job: 1, inspector: "rohan@kromdetail.com", inspectionType: "FINAL", status: "COMPLETED", completedDaysAgo: 2, odometerReading: 18400, fuelLevel: 80,
    exteriorCondition: "Paint has an even gloss and the glass is streak-free.",
    interiorCondition: "Headliner stain is reduced and the cabin is fresh.",
    notes: "Final quality check before vehicle handover.",
    items: [
      { component: "Paint finish", condition: "GOOD", notes: "Even gloss after the polish.", imageSeeds: ["inspection-job1-paint"], recommendedAction: "Maintain with a safe wash routine." },
      { component: "Headliner", condition: "FAIR", notes: "Old stain is significantly reduced.", imageSeeds: ["inspection-job1-headliner"], recommendedAction: "Spot-clean during the next interior service." },
      { component: "Glass and mirrors", condition: "GOOD", notes: "No visible streaks or water spots.", imageSeeds: ["inspection-job1-glass"], recommendedAction: "No action required." },
    ],
  },
];

const JOB_TASKS = [
  {
    job: 1, sequence: 0, title: "Decontaminate exterior paint", description: "Remove road film and check the front bumper before polishing.", taskType: "DETAILING", mechanic: "MECH-SHAIN-01", status: "COMPLETED", estimatedMinutes: 90, actualMinutes: 95, startedDaysAgo: 3, completedDaysAgo: 2, notes: "Completed before the final polish pass.",
  },
  {
    job: 1, sequence: 1, title: "Complete interior stain treatment", description: "Treat the headliner and front passenger seat marks.", taskType: "DETAILING", mechanic: "MECH-SHAIN-01", status: "COMPLETED", estimatedMinutes: 120, actualMinutes: 130, startedDaysAgo: 2, completedDaysAgo: 2, notes: "Customer requested extra care on the headliner.",
  },
  {
    job: 3, sequence: 0, title: "Photograph bumper stone chips", description: "Capture close-up images and record the recommended touch-up.", taskType: "INSPECTION", mechanic: "MECH-SHAIN-01", status: "IN_PROGRESS", estimatedMinutes: 20, startedDaysAgo: 1, notes: "Inspection is being documented for the estimate.",
  },
  {
    job: 3, sequence: 1, title: "Prepare revised coating estimate", description: "Include the bumper touch-up and single-stage polish.", taskType: "DETAILING", mechanic: "MECH-SHAIN-01", status: "BLOCKED", estimatedMinutes: 30, blockedReason: "Waiting for customer approval on the revised estimate.", notes: "Resume after the estimate is approved.",
  },
  {
    job: 4, sequence: 0, title: "Replace front brake pads", description: "Fit the Bosch front set and bed the pads against the disc.", taskType: "REPAIR", mechanic: "MECH-SPEED-01", status: "IN_PROGRESS", estimatedMinutes: 120, startedDaysAgo: 1, notes: "Torque check is required after fitting.",
  },
  {
    job: 4, sequence: 1, title: "Torque wheel nuts", description: "Check wheel nut torque on all four corners.", taskType: "MAINTENANCE", mechanic: "MECH-SPEED-01", status: "PENDING", estimatedMinutes: 20, notes: "Complete after the brake road test.",
  },
  {
    job: 7, sequence: 0, title: "Final polish and glass check", description: "Inspect gloss, remove residue and clean the glass surfaces.", taskType: "DETAILING", mechanic: "MECH-SHAIN-02", status: "COMPLETED", estimatedMinutes: 60, actualMinutes: 65, startedDaysAgo: 1, completedDaysAgo: 1, notes: "Ready for the quality-check sign-off.",
  },
];

const JOB_PARTS = [
  { num: 1, job: 1, part: "WP-1001", quantity: 1, status: "USED", statusReason: "Used during the full-body polish.", reservedDaysAgo: 3, usedDaysAgo: 2 },
  { num: 2, job: 3, part: "WP-1003", quantity: 1, status: "RESERVED", statusReason: "Reserved for the seat shampooing service.", reservedDaysAgo: 1 },
  { num: 3, job: 4, part: "MP-2002", quantity: 1, status: "USED", statusReason: "Front brake pads replaced during the brake service.", reservedDaysAgo: 2, usedDaysAgo: 1 },
  { num: 4, job: 7, part: "WP-1002", quantity: 1, status: "USED", statusReason: "Polish compound used during the final correction.", reservedDaysAgo: 1, usedDaysAgo: 1 },
];

const INVOICES = [
  { num: 1, number: "A1B2C3D4", job: 1, estimate: "EST-2026-001", status: "PAID", createdBy: "rohan@kromdetail.com", issuedDaysAgo: 4 },
  { num: 2, number: "B2C3D4E5", job: 4, estimate: "EST-2026-004", status: "PARTIALLY_PAID", createdBy: "divya@kromdetail.com", issuedDaysAgo: 2 },
];

const PAYMENTS = [
  { num: 1, number: "E4F50617", invoice: 1, job: 1, method: "UPI", amount: 6544, amountMinor: 654400, status: "SUCCESS", paidDaysAgo: 2, recordedBy: "rohan@kromdetail.com", notes: "Seeded demo UPI receipt; no online gateway capture." },
  { num: 2, number: "F50617A8", invoice: 2, job: 4, method: "CASH", amount: 1500.5, amountMinor: 150050, status: "SUCCESS", paidDaysAgo: 1, recordedBy: "divya@kromdetail.com", notes: "Seeded demo cash receipt; balance is pending." },
];

const REVIEWS = [
  {
    num: 1, booking: 1, customer: "priya@example.com", rating: 5, title: "Beautiful finish and very careful service", comment: "The Creta looks brilliant after the detailing. Rohan explained the paint care clearly and the cabin feels fresh.", imageSeeds: ["review-creta-finish"], status: "PUBLISHED", responseBy: "rohan@kromdetail.com", responseMessage: "Thank you, Priya. We are glad the finish met your expectations.", responseDaysAgo: 1,
  },
];

const NOTIFICATIONS = [
  { num: 1, user: "priya@example.com", type: "BOOKING_CONFIRMED", title: "Booking confirmed", message: "Your Creta booking BKG-2026-0001 is confirmed for 05 Sep 2026.", reference: { type: "BOOKING", booking: 1 }, dedupeKey: "seed-booking-1-confirmed", status: "READ", sentDaysAgo: 4, readDaysAgo: 3 },
  { num: 2, user: "priya@example.com", type: "INVOICE_PAID", title: "Payment received", message: "Payment of Rs. 6,544 received against INV-2026-A1B2C3D4. Thank you.", reference: { type: "INVOICE", invoice: 1 }, dedupeKey: "seed-invoice-1-paid", status: "READ", sentDaysAgo: 2, readDaysAgo: 1 },
  { num: 3, user: "arjun@example.com", type: "ESTIMATE_READY", title: "Estimate ready for approval", message: "The revised estimate EST-2026-004 is ready for your approval.", reference: { type: "ESTIMATE", estimate: "EST-2026-004" }, dedupeKey: "seed-estimate-4-ready", status: "SENT", sentDaysAgo: 1 },
  { num: 4, user: "arjun@example.com", type: "JOB_STARTED", title: "Work started", message: "Your Nexon has arrived at Speed X and the diagnostic check is in progress.", reference: { type: "JOB", job: 4 }, dedupeKey: "seed-job-4-started", status: "SENT", sentDaysAgo: 1 },
  { num: 5, user: "priya@example.com", type: "REVIEW_RESPONSE", title: "Thanks for your review", message: "Thanks for your review. We are glad the finish met your expectations.", reference: { type: "REVIEW", review: 1 }, dedupeKey: "seed-review-1-response", status: "SENT", sentDaysAgo: 0 },
  { num: 6, user: "rohan@kromdetail.com", type: "INVOICE_ISSUED", title: "Invoice issued", message: "Invoice INV-2026-B2C3D4E5 is issued; Rs. 1,500.50 is pending.", reference: { type: "INVOICE", invoice: 2 }, dedupeKey: "seed-invoice-2-issued", status: "SENT", sentDaysAgo: 2 },
];

const AUDIT_LOGS = [
  { num: 1, requestId: "seed-audit-invoice-1-issued", actor: "rohan@kromdetail.com", action: "INVOICE_ISSUED", entityType: "Invoice", entity: { invoice: 1 }, oldValue: { status: "DRAFT" }, newValue: { status: "ISSUED" }, metadata: { source: "seed" }, method: "POST", path: "/api/invoices/1/issue" },
  { num: 2, requestId: "seed-audit-invoice-2-created", actor: "divya@kromdetail.com", action: "INVOICE_CREATED", entityType: "Invoice", entity: { invoice: 2 }, oldValue: {}, newValue: { status: "DRAFT" }, metadata: { source: "seed" }, method: "POST", path: "/api/invoices" },
  { num: 3, requestId: "seed-audit-payment-1-recorded", actor: "rohan@kromdetail.com", action: "PAYMENT_RECORDED", entityType: "Payment", entity: { payment: 1 }, oldValue: {}, newValue: { status: "SUCCESS", amountMinor: 654400 }, metadata: { source: "seed", method: "UPI" }, method: "POST", path: "/api/payments/offline" },
  { num: 4, requestId: "seed-audit-payment-2-recorded", actor: "divya@kromdetail.com", action: "PAYMENT_RECORDED", entityType: "Payment", entity: { payment: 2 }, oldValue: {}, newValue: { status: "SUCCESS", amountMinor: 150050 }, metadata: { source: "seed", method: "CASH" }, method: "POST", path: "/api/payments/offline" },
  { num: 5, requestId: "seed-audit-review-1-created", actor: "priya@example.com", action: "REVIEW_CREATED", entityType: "Review", entity: { review: 1 }, oldValue: {}, newValue: { rating: 5, status: "PUBLISHED" }, metadata: { source: "seed" }, method: "POST", path: "/api/reviews" },
  { num: 6, requestId: "seed-audit-inspection-1-created", actor: "karan@kromdetail.com", action: "INSPECTION_CREATED", entityType: "Inspection", entity: { inspection: 1 }, oldValue: {}, newValue: { status: "DRAFT", inspectionType: "INITIAL" }, metadata: { source: "seed" }, method: "POST", path: "/api/jobs/3/inspections" },
  { num: 7, requestId: "seed-audit-task-4-started", actor: "anil@kromdetail.com", action: "JOB_TASK_STARTED", entityType: "JobTask", entity: { job: 4, sequence: 0 }, oldValue: { status: "PENDING" }, newValue: { status: "IN_PROGRESS" }, metadata: { source: "seed" }, method: "PATCH", path: "/api/jobs/4/tasks/0/status" },
  { num: 8, requestId: "seed-audit-notification-6-sent", actor: "admin@kromdetail.com", action: "NOTIFICATION_SENT", entityType: "Notification", entity: { notification: 6 }, oldValue: {}, newValue: { status: "SENT" }, metadata: { source: "seed" }, method: "POST", path: "/api/notifications" },
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
        let changed = false;

        if ((existing.workshopId?.toString() || null) !== (userData.workshopId?.toString() || null)) {
          existing.workshopId = userData.workshopId || null;
          changed = true;
        }

        // Re-running the seed must keep demo accounts loggable: the three day
        // re-verify gate blocks login with an OTP-only response once it lapses.
        if (existing.needsVerification || !existing.emailVerified || existing.status !== "ACTIVE") {
          existing.needsVerification = false;
          existing.emailVerified = true;
          existing.phoneVerified = true;
          existing.status = "ACTIVE";
          changed = true;
        }

        if (!existing.threeDayExpires || new Date(existing.threeDayExpires) < new Date()) {
          existing.threeDayExpires = userData.threeDayExpires;
          changed = true;
        }

        if (existing.verificationCode || existing.verificationCodeExpires) {
          existing.verificationCode = null;
          existing.verificationCodeExpires = null;
          changed = true;
        }

        if (changed) await existing.save();
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
        workshopManagerId: userMap.get(j.manager)?._id || null,
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

    const estimateMap = new Map((await Estimate.find()).map((e) => [e.estimateNumber, e]));

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

    const inventoryPartMap = new Map((await InventoryPart.find()).map((p) => [`${p.workshopId}_${p.partNumber}`, p]));

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

    const inspectionMap = new Map();
    for (const i of INSPECTIONS) {
      const job = jobMap.get(i.job);
      const inspector = userMap.get(i.inspector);
      if (!job || !inspector) continue;
      const existing = await Inspection.findOne({ jobId: job._id, inspectionType: i.inspectionType, odometerReading: i.odometerReading });
      if (existing) {
        inspectionMap.set(i.num, existing);
        continue;
      }
      const inspectionData = {
        jobId: job._id,
        inspectorId: inspector._id,
        inspectionType: i.inspectionType,
        status: i.status,
        odometerReading: i.odometerReading,
        fuelLevel: i.fuelLevel,
        exteriorCondition: i.exteriorCondition,
        interiorCondition: i.interiorCondition,
        notes: i.notes,
        items: i.items.map((item) => ({
          component: item.component,
          condition: item.condition,
          notes: item.notes,
          images: (item.imageSeeds || []).map((seed) => ({ url: img(seed), publicId: null })),
          recommendedAction: item.recommendedAction,
        })),
      };
      if (i.status === "COMPLETED") inspectionData.completedAt = iso(addDays(new Date(), -(i.completedDaysAgo || 0)));
      const inspection = await Inspection.create(inspectionData);
      inspectionMap.set(i.num, inspection);
    }
    counts.inspections = await Inspection.countDocuments();

    const taskMap = new Map();
    for (const t of JOB_TASKS) {
      const job = jobMap.get(t.job);
      const mechanic = t.mechanic ? mechanicMap.get(t.mechanic) : null;
      if (!job || (t.mechanic && !mechanic)) continue;
      if (mechanic && mechanic.workshopId.toString() !== job.workshopId.toString()) continue;
      const existing = await JobTask.findOne({ jobId: job._id, sequence: t.sequence });
      if (existing) {
        taskMap.set(`${t.job}-${t.sequence}`, existing);
        continue;
      }
      const taskData = {
        jobId: job._id,
        sequence: t.sequence,
        title: t.title,
        description: t.description,
        taskType: t.taskType,
        assignedMechanicId: mechanic?._id || null,
        status: t.status,
        estimatedMinutes: t.estimatedMinutes,
        actualMinutes: t.actualMinutes,
        notes: t.notes,
      };
      if (t.startedDaysAgo !== undefined) taskData.startedAt = iso(addDays(new Date(), -t.startedDaysAgo));
      if (t.completedDaysAgo !== undefined) taskData.completedAt = iso(addDays(new Date(), -t.completedDaysAgo));
      if (t.blockedReason) taskData.blockedReason = t.blockedReason;
      const task = await JobTask.create(taskData);
      taskMap.set(`${t.job}-${t.sequence}`, task);
    }
    counts.jobTasks = await JobTask.countDocuments();

    const jobPartMap = new Map();
    for (const p of JOB_PARTS) {
      const job = jobMap.get(p.job);
      if (!job) continue;
      const inventoryPart = inventoryPartMap.get(`${job.workshopId}_${p.part}`);
      if (!inventoryPart) continue;
      const existing = await JobPart.findOne({ jobId: job._id, inventoryPartId: inventoryPart._id });
      if (existing) {
        jobPartMap.set(p.num, existing);
        continue;
      }
      const unitPrice = round2(inventoryPart.sellingPrice);
      const partData = {
        jobId: job._id,
        inventoryPartId: inventoryPart._id,
        quantity: p.quantity,
        unitPrice,
        totalPrice: round2(unitPrice * p.quantity),
        status: p.status,
        statusReason: p.statusReason,
      };
      if (p.reservedDaysAgo !== undefined) partData.reservedAt = iso(addDays(new Date(), -p.reservedDaysAgo));
      if (p.usedDaysAgo !== undefined) partData.usedAt = iso(addDays(new Date(), -p.usedDaysAgo));
      if (p.status === "RESERVED") {
        const stockUpdate = await InventoryPart.updateOne(
          { _id: inventoryPart._id, workshopId: job.workshopId, $expr: { $gte: [{ $subtract: ["$stock.quantity", "$stock.reservedQuantity"] }, p.quantity] } },
          { $inc: { "stock.reservedQuantity": p.quantity }, $set: { "stock.reasonOfLastAdjustment": `Reserved for job ${job.jobNumber}` } }
        );
        if (stockUpdate.matchedCount === 0) continue;
      } else if (p.status === "USED") {
        const stockUpdate = await InventoryPart.updateOne(
          { _id: inventoryPart._id, workshopId: job.workshopId, "stock.quantity": { $gte: p.quantity } },
          { $inc: { "stock.quantity": -p.quantity }, $set: { "stock.reasonOfLastAdjustment": `Used on job ${job.jobNumber}` } }
        );
        if (stockUpdate.matchedCount === 0) continue;
      }
      const part = await JobPart.create(partData);
      jobPartMap.set(p.num, part);
    }
    counts.jobParts = await JobPart.countDocuments();

    const invoiceMap = new Map();
    for (const i of INVOICES) {
      const job = jobMap.get(i.job);
      const estimate = estimateMap.get(i.estimate);
      if (!job || !estimate || estimate.status !== "APPROVED" || estimate.jobId.toString() !== job._id.toString()) continue;
      const invoiceNumber = `INV-2026-${i.number}`;
      const existing = await Invoice.findOne({ $or: [{ invoiceNumber }, { jobId: job._id }] });
      if (existing) {
        invoiceMap.set(i.num, existing);
        invoiceMap.set(`job:${job._id}`, existing);
        continue;
      }
      const booking = await Booking.findById(job.bookingId);
      const customer = await User.findById(job.customerId);
      const vehicle = await Vehicle.findById(job.vehicleId);
      if (!booking || !customer || !vehicle) continue;
      if (booking.customerId.toString() !== customer._id.toString() || booking.vehicleId.toString() !== vehicle._id.toString() || booking.workshopId.toString() !== job.workshopId.toString()) continue;
      const createdBy = userMap.get(i.createdBy)?._id;
      if (!createdBy) continue;
      const items = estimate.items.map((item) => ({
        type: item.type,
        referenceId: item.referenceId || null,
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: 0,
        taxAmount: 0,
        total: round2(item.quantity * item.unitPrice),
      }));
      const breakup = priceBreakup(items, estimate.pricing?.discount || 0);
      const invoiceData = {
        invoiceNumber,
        jobId: job._id,
        estimateId: estimate._id,
        bookingId: booking._id,
        customerId: customer._id,
        workshopId: job.workshopId,
        customerSnapshot: { name: customer.name, email: customer.email, phone: customer.phone },
        vehicleSnapshot: { registrationNumber: vehicle.registrationNumber, make: vehicle.make, model: vehicle.model, variant: vehicle.variant, manufacturingYear: vehicle.manufacturingYear },
        bookingSnapshot: { bookingNumber: booking.bookingNumber, status: booking.status, paymentStatus: booking.paymentStatus, appointmentDate: booking.appointment?.date },
        jobSnapshot: { jobNumber: job.jobNumber, status: job.status, completedAt: job.completedAt },
        estimateSnapshot: { estimateNumber: estimate.estimateNumber, version: estimate.version, status: estimate.status },
        items,
        currency: "INR",
        pricing: { subtotal: breakup.subtotal, discount: breakup.discount, tax: breakup.tax, roundOff: 0, grandTotal: breakup.total },
        status: i.status,
        createdBy,
      };
      if (i.status !== "DRAFT") {
        invoiceData.issuedAt = iso(addDays(new Date(), -i.issuedDaysAgo));
        invoiceData.dueAt = iso(addDays(new Date(), 7 - i.issuedDaysAgo));
        invoiceData.issuedBy = createdBy;
      }
      const invoice = await Invoice.create(invoiceData);
      invoiceMap.set(i.num, invoice);
      invoiceMap.set(`job:${job._id}`, invoice);
    }
    counts.invoices = await Invoice.countDocuments();

    const paymentMap = new Map();
    for (const p of PAYMENTS) {
      const paymentNumber = `PAY-2026-${p.number}`;
      const existing = await Payment.findOne({ paymentNumber });
      if (existing) {
        paymentMap.set(p.num, existing);
        continue;
      }
      const job = jobMap.get(p.job);
      const invoice = invoiceMap.get(p.invoice) || (job ? await Invoice.findOne({ jobId: job._id }) : null);
      const recordedBy = userMap.get(p.recordedBy)?._id;
      if (!invoice || !recordedBy) continue;
      const paymentData = {
        paymentNumber,
        invoiceId: invoice._id,
        bookingId: invoice.bookingId,
        customerId: invoice.customerId,
        workshopId: invoice.workshopId,
        gateway: p.method,
        amount: p.amount,
        amountMinor: p.amountMinor,
        currency: "INR",
        method: p.method,
        status: p.status,
        paidAt: iso(addDays(new Date(), -p.paidDaysAgo)),
        metadata: { source: "offline", recordedBy, notes: p.notes },
      };
      const payment = await upsertByQuery(Payment, { paymentNumber }, paymentData);
      paymentMap.set(p.num, payment);
    }
    counts.payments = await Payment.countDocuments();

    const reviewMap = new Map();
    for (const r of REVIEWS) {
      const booking = bookingMap.get(`BKG-2026-${pad(r.booking, 4)}`);
      const customer = userMap.get(r.customer);
      if (!booking || !customer || booking.customerId.toString() !== customer._id.toString() || booking.status !== "COMPLETED" || booking.paymentStatus !== "PAID") continue;
      const existing = await Review.findOne({ bookingId: booking._id });
      if (existing) {
        reviewMap.set(r.num, existing);
        continue;
      }
      const responder = userMap.get(r.responseBy);
      if (!responder || !responder.workshopId || responder.workshopId.toString() !== booking.workshopId.toString()) continue;
      const reviewData = {
        customerId: booking.customerId,
        bookingId: booking._id,
        vehicleId: booking.vehicleId,
        workshopId: booking.workshopId,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: (r.imageSeeds || []).map((seed) => ({ url: img(seed), publicId: null })),
        status: r.status,
        response: { message: r.responseMessage, respondedBy: responder._id, respondedAt: iso(addDays(new Date(), -(r.responseDaysAgo || 0))) },
      };
      const review = await Review.create(reviewData);
      reviewMap.set(r.num, review);
    }
    counts.reviews = await Review.countDocuments();

    const notificationMap = new Map();
    for (const n of NOTIFICATIONS) {
      const user = userMap.get(n.user);
      if (!user) continue;
      let referenceId = null;
      if (n.reference.type === "BOOKING") {
        referenceId = bookingMap.get(`BKG-2026-${pad(n.reference.booking, 4)}`)?._id || null;
      } else if (n.reference.type === "ESTIMATE") {
        referenceId = estimateMap.get(n.reference.estimate)?._id || null;
      } else if (n.reference.type === "JOB") {
        referenceId = jobMap.get(n.reference.job)?._id || null;
      } else if (n.reference.type === "INVOICE") {
        referenceId = invoiceMap.get(n.reference.invoice)?._id || null;
      } else if (n.reference.type === "PAYMENT") {
        referenceId = paymentMap.get(n.reference.payment)?._id || null;
      } else if (n.reference.type === "REVIEW") {
        referenceId = reviewMap.get(n.reference.review)?._id || null;
      }
      if (!referenceId) continue;
      const notificationData = {
        userId: user._id,
        type: n.type,
        channel: "IN_APP",
        title: n.title,
        message: n.message,
        reference: { type: n.reference.type, id: referenceId },
        dedupeKey: n.dedupeKey,
        status: n.status,
        sentAt: iso(addDays(new Date(), -n.sentDaysAgo)),
        readAt: n.status === "READ" ? iso(addDays(new Date(), -(n.readDaysAgo || 0))) : null,
      };
      const notification = await upsertByQuery(Notification, { userId: user._id, dedupeKey: n.dedupeKey }, notificationData);
      notificationMap.set(n.num, notification);
    }
    counts.notifications = await Notification.countDocuments();

    const auditLogMap = new Map();
    for (const a of AUDIT_LOGS) {
      const actor = userMap.get(a.actor);
      let entity = null;
      if (a.entityType === "Invoice") entity = invoiceMap.get(a.entity.invoice);
      else if (a.entityType === "Payment") entity = paymentMap.get(a.entity.payment);
      else if (a.entityType === "Review") entity = reviewMap.get(a.entity.review);
      else if (a.entityType === "Inspection") entity = inspectionMap.get(a.entity.inspection);
      else if (a.entityType === "JobTask") entity = taskMap.get(`${a.entity.job}-${a.entity.sequence}`);
      else if (a.entityType === "Notification") entity = notificationMap.get(a.entity.notification);
      if (!actor || !entity) continue;
      const auditData = {
        actorId: actor._id,
        actorRole: actor.role,
        actorName: actor.name,
        actorEmail: actor.email,
        action: a.action,
        entityType: a.entityType,
        entityId: entity._id,
        oldValue: a.oldValue,
        newValue: a.newValue,
        metadata: { source: "seed", ...(a.metadata || {}) },
        requestId: a.requestId,
        method: a.method,
        path: a.path,
      };
      const auditLog = await upsertByQuery(AuditLog, { requestId: a.requestId }, auditData);
      auditLogMap.set(a.num, auditLog);
    }
    counts.auditLogs = await AuditLog.countDocuments();

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