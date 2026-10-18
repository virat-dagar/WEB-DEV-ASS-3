const mongoose = require("mongoose");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");

// POST /api/products
const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};

// GET /api/products?category=&minPrice=&maxPrice=&inStock=&search=&sort=&page=&limit=
const getProducts = async (req, res) => {
  const {
    category,
    minPrice,
    maxPrice,
    inStock,
    search,
    sort = "-createdAt",
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (inStock === "true") filter.quantity = { $gt: 0 };
  if (inStock === "false") filter.quantity = 0;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort.split(",").join(" "))
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    count: products.length,
    products,
  });
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  res.json(product);
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new AppError("Product not found", 404);
  res.json(product);
};

// PATCH /api/products/:id/stock   body: { "change": 10 }  or  { "change": -5 }
// Atomic: the $inc is guarded so stock can never go negative.
const adjustStock = async (req, res) => {
  const { change } = req.body;
  if (!Number.isInteger(change) || change === 0) {
    throw new AppError('"change" must be a non-zero integer', 400);
  }

  const query = { _id: req.params.id };
  if (change < 0) query.quantity = { $gte: Math.abs(change) }; // prevent oversell

  const product = await Product.findOneAndUpdate(
    query,
    { $inc: { quantity: change } },
    { new: true },
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError("Product not found", 404);
    throw new AppError("Insufficient stock for this operation", 400);
  }

  res.json({ message: "Stock updated", product });
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  res.json({ message: "Product deleted", id: product._id });
};

// GET /api/products/low-stock
const getLowStock = async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ["$quantity", "$reorderLevel"] } } },
    { $sort: { quantity: 1 } },
    {
      $addFields: {
        stockValue: { $multiply: ["$price", "$quantity"] },
      },
    },
  ]);

  res.json({ count: lowStockItems.length, lowStockItems });
};

// GET /api/products/summary
const getCategorySummary = async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalStockValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        avgPrice: { $avg: "$price" },
      },
    },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.json({ categories: summary.length, summary });
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
};
