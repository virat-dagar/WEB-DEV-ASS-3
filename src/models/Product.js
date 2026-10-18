const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z0-9-]+$/,
        "SKU may only contain letters, numbers, and hyphens",
      ],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      default: 0,
      min: [0, "Quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
    reorderLevel: {
      type: Number,
      required: [true, "Reorder level is required"],
      min: [0, "Reorder level cannot be negative"],
    },
    supplier: {
      type: String,
      trim: true,
      default: "Unknown",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  },
);

// Virtual: stock value = price * quantity
productSchema.virtual("stockValue").get(function () {
  return this.price * this.quantity;
});

// Virtual: "id" mirrors "_id" as a string (matches the expected output)
productSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

productSchema.index({ category: 1 });
productSchema.index({ quantity: 1 });

module.exports = mongoose.model("Product", productSchema);
