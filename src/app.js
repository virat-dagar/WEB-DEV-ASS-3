const express = require("express");
const productRoutes = require("./routes/productRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Inventory API is running" }));
app.use("/api/products", productRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
