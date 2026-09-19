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
    },
    items: {
      type: [invoiceItemSchema],
      default: [],
    },
    pricing: {
      subtotal: { type: Number, min: 0, default: 0 },
      discount: { type: Number, min: 0, default: 0 },
      tax: { type: Number, min: 0, default: 0 },
      roundOff: { type: Number, min: 0, default: 0 },
      grandTotal: { type: Number, min: 0, default: 0 },
    },
    status: {
      type: String,
      enum: ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "VOID"],
      default: "DRAFT",
    },
    issuedAt: { type: Date },
    dueAt: { type: Date },
    pdfUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

invoiceSchema.index({ jobId: 1 }, { unique: true });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ workshopId: 1, status: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;