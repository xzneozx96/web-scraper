const express = require("express");
const router = express.Router();

const scrapeChototController = require("../controllers/scrape-chotot");

router.get("/scrape-chotot", scrapeChototController.getProducts);

module.exports = router;
