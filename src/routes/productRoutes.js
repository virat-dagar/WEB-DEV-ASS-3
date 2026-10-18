const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
} = require("../controllers/productController");
const { validateBody, validateObjectId } = require("../middleware/validate");

// Static routes must come before "/:id" so they aren't captured as IDs
router.get("/low-stock", getLowStock);
router.get("/summary", getCategorySummary);

router.route("/").get(getProducts).post(validateBody, createProduct);

router
  .route("/:id")
  .get(validateObjectId, getProductById)
  .put(validateObjectId, validateBody, updateProduct)
  .delete(validateObjectId, deleteProduct);

router.patch("/:id/stock", validateObjectId, adjustStock);

module.exports = router;
