const express = require("express");
const router = express.Router();

const scrapeYoutubeController = require("../controllers/scrape-youtube");

router.get("/subtitle/:videoId", scrapeYoutubeController.getScript);

module.exports = router;
