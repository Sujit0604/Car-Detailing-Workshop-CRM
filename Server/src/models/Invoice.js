const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["SERVICE", "LABOUR", "PART", "OTHER"],
      default: "SERVICE",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    taxRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      unique: true,
    },
    estimateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Estimate",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },
    customerSnapshot: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },
    vehicleSnapshot: {
      registrationNumber: { type: String, trim: true },
      make: { type: String, trim: true },
      model: { type: String, trim: true },
      variant: { type: String, trim: true },
      manufacturingYear: { type: Number },
    },
    bookingSnapshot: {
      bookingNumber: { type: String, trim: true },
      status: { type: String, trim: true },
      paymentStatus: { type: String, trim: true },
      appointmentDate: { type: Date },
    },
    jobSnapshot: {
      jobNumber: { type: String, trim: true },
      status: { type: String, trim: true },
      completedAt: { type: Date },
    },
    estimateSnapshot: {
      estimateNumber: { type: String, trim: true },
      version: { type: Number, min: 1 },
      status: { type: String, trim: true },
    },
    items: {
      type: [invoiceItemSchema],
      default: [],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    pricing: {
      subtotal: { type: Number, min: 0, default: 0 },
      discount: { type: Number, min: 0, default: 0 },
      tax: { type: Number, min: 0, default: 0 },
      roundOff: { type: Number, default: 0 },
      grandTotal: { type: Number, min: 0, default: 0 },
    },
    status: {
      type: String,
      enum: ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "VOID"],
      default: "DRAFT",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    issuedAt: { type: Date },
    dueAt: { type: Date },
    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    voidedAt: { type: Date },
    voidReason: {
      type: String,
      trim: true,
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

invoiceSchema.index({ customerId: 1, status: 1, createdAt: -1 });
invoiceSchema.index({ workshopId: 1, status: 1, createdAt: -1 });
invoiceSchema.index({ estimateId: 1 });
invoiceSchema.index({ status: 1, dueAt: 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
