const mongoose = require("mongoose");

const inventoryPartSchema = new mongoose.Schema(
  {
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },
    partNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      trim: true,
    },
    purchasePrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    stock: {
      quantity: { type: Number, min: 0, default: 0 },
      reservedQuantity: { type: Number, min: 0, default: 0 },
      reasonOfLastAdjustment: { type: String, trim: true, default: null },
      reorderLevel: { type: Number, min: 0, default: 0 },
      maxStockLevel: { type: Number, min: 0, default: 0 },
    },
    supplier: {
      name: { type: String, trim: true },
      contact: { type: String, trim: true },
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

inventoryPartSchema.index({ workshopId: 1, partNumber: 1 }, { unique: true });
inventoryPartSchema.index({ name: 1 });

const InventoryPart = mongoose.model("InventoryPart", inventoryPartSchema);

module.exports = InventoryPart;